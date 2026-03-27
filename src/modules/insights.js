import { MOVIES, CATEGORIES, currentUser } from '../state.js';
import { getFilmObservationWeight } from './weight-blend.js';
import { track } from '../analytics.js';
import { loadGeneratedArtifact, saveGeneratedArtifact, sb } from './supabase.js';
import { canUseCredit, recordCreditUsage, getCreditPolicy, syncCreditsFromResponse } from './credit-policy.js';

const PROXY_URL = 'https://palate-map-proxy.noahparikhcott.workers.dev';
const CACHE_KEY = 'palate_insights_v1';

// Sentinel thrown when quota is exhausted (not a real error)
export class InsightQuotaExhausted extends Error {
  constructor() { super('insight_quota_exhausted'); this.name = 'InsightQuotaExhausted'; }
}

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

// Entity insight: stale if ≥3 new films added to this entity, or avg shifts ≥5 pts.
// Film insight: stale if total score shifts ≥5 pts.
// Small calibration moves never cross these thresholds — copy stays stable.
function isEntityStale(entry, filmCount, avg) {
  if (!entry) return true;
  if (filmCount - (entry.filmCount || 0) >= 3) return true;
  if (Math.abs((entry.avg || 0) - avg) >= 5) return true;
  return false;
}

function isFilmStale(entry, total) {
  if (!entry) return true;
  if (Math.abs((entry.total || 0) - total) >= 5) return true;
  return false;
}

function buildOverallStats() {
  const stats = {};
  CATEGORIES.forEach(cat => {
    let wSum = 0, wTotal = 0;
    for (const m of MOVIES) {
      const s = m.scores?.[cat.key];
      if (s == null) continue;
      const w = getFilmObservationWeight(m, cat.key);
      wSum += s * w;
      wTotal += w;
    }
    stats[cat.key] = wTotal > 0 ? Math.round(wSum / wTotal) : null;
  });
  return stats;
}

async function callClaude(system, user, creditSource) {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {}

  const body = { system, messages: [{ role: 'user', content: user }] };
  if (creditSource) body.credit_source = creditSource;

  const res = await fetch(PROXY_URL, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();

  // Sync credit balance from server piggyback
  if (data._credits) syncCreditsFromResponse(data._credits);

  // Server-side credit enforcement may reject
  if (data.error === 'quota_exceeded' || data.error === 'auth_required') {
    throw new InsightQuotaExhausted();
  }

  return (data.content?.[0]?.text || '').trim();
}

// ── ENTITY INSIGHT (director / writer / actor / company / year) ──────────────

export async function getEntityInsight(type, name, films) {
  const cache = loadCache();
  const key = `${type}::${name}`;
  const filmCount = films.length;
  const avg = Math.round(films.reduce((s, f) => s + (f.total || 0), 0) / filmCount);

  // Cached insight — always free
  if (!isEntityStale(cache[key], filmCount, avg)) {
    track('insight_cache_hit', { type: 'entity', key, tier: getCreditPolicy().tier });
    return cache[key].text;
  }

  // Server artifact — free (user already paid for this generation)
  const entityObjectId = `${type}::${name.toLowerCase().trim()}`;
  try {
    const artifact = await loadGeneratedArtifact('entity_insight', entityObjectId);
    if (artifact?.payload?.text && !isEntityStale({ filmCount: artifact.payload.filmCount, avg: artifact.payload.avg }, filmCount, avg)) {
      cache[key] = { text: artifact.payload.text, filmCount: artifact.payload.filmCount, avg: artifact.payload.avg, ts: Date.now(), generatedAt: artifact.generated_at };
      saveCache(cache);
      track('insight_server_hit', { type: 'entity', key, tier: getCreditPolicy().tier });
      return artifact.payload.text;
    }
  } catch { /* server unavailable — fall through to fresh generation */ }

  // Fresh generation — check quota
  const quotaCheck = canUseCredit();
  if (!quotaCheck.allowed) {
    track('insight_quota_blocked', { type: 'entity', key, reason: quotaCheck.reason, tier: getCreditPolicy().tier });
    throw new InsightQuotaExhausted();
  }

  const overall = buildOverallStats();
  const statStr = CATEGORIES.map(c => `${c.label} ${overall[c.key] ?? '—'}`).join(', ');
  const arch = currentUser?.archetype || 'unknown';

  const filmLines = [...films]
    .sort((a, b) => b.total - a.total)
    .map(f => {
      const cats = CATEGORIES.map(c => `${c.label.toLowerCase()}=${f.scores[c.key] ?? '—'}`).join(', ');
      return `- ${f.title} (${f.year || '?'}): total=${f.total}, ${cats}`;
    }).join('\n');

  const typeLabel = type === 'year' ? `the year ${name}` : `${type} ${name}`;

  const system = `You are a film taste analyst writing short personal insights for a taste-tracking app called Palate Map. Write exactly 2–3 sentences. Second person only ("you", "your"). No preamble, no hedging. Be direct and specific — always cite actual film titles and scores. Never describe the entity generically; only describe what THIS user's scores reveal about their relationship with the work.`;

  const userPrompt = `User archetype: ${arch}
User's category averages across all ${MOVIES.length} films: ${statStr}

Entity: ${typeLabel}
Films this user has rated: ${filmCount} | Average score: ${avg}

${filmLines}

Write 2–3 sentences in second person about what this user's scoring patterns reveal about what they value in ${typeLabel}'s work. Be precise — reference film titles, specific scores, category highs/lows.`;

  const text = await callClaude(system, userPrompt, 'entity_insight');
  const generatedAt = new Date().toISOString();

  // Persist server-side BEFORE recording quota spend — if this fails,
  // the user keeps the text locally but doesn't lose a credit for a
  // non-durable artifact.
  const persisted = await saveGeneratedArtifact({
    contentType: 'entity_insight',
    objectType: 'entity',
    objectId: entityObjectId,
    objectLabel: `${type}: ${name}`,
    payload: { text, filmCount, avg },
    summaryText: text,
    generationSource: 'entity_insight',
    metadata: { filmCount, avg, type, name },
  });

  cache[key] = { text, filmCount, avg, ts: Date.now(), generatedAt };
  saveCache(cache);
  if (persisted) recordCreditUsage('insight', null, key);

  return text;
}

// ── FILM INSIGHT ─────────────────────────────────────────────────────────────

export async function getFilmInsight(film) {
  const cache = loadCache();
  const key = film.tmdbId ? `film::tmdb:${film.tmdbId}` : `film::${film.title}::${film.year || ''}`;

  // Cached insight — always free
  if (!isFilmStale(cache[key], film.total)) {
    track('insight_cache_hit', { type: 'film', key, tier: getCreditPolicy().tier });
    return cache[key].text;
  }

  // Server artifact — free (user already paid for this generation)
  const filmObjectId = film.tmdbId ? String(film.tmdbId) : `${film.title}::${film.year || ''}`;
  try {
    const artifact = await loadGeneratedArtifact('film_insight', filmObjectId);
    if (artifact?.payload?.text && !isFilmStale({ total: artifact.payload.total }, film.total)) {
      cache[key] = { text: artifact.payload.text, filmCount: 1, total: artifact.payload.total, ts: Date.now(), generatedAt: artifact.generated_at };
      saveCache(cache);
      track('insight_server_hit', { type: 'film', key, tier: getCreditPolicy().tier });
      return artifact.payload.text;
    }
  } catch { /* server unavailable — fall through to fresh generation */ }

  // Fresh generation — check quota
  const quotaCheck = canUseCredit();
  if (!quotaCheck.allowed) {
    track('insight_quota_blocked', { type: 'film', key, reason: quotaCheck.reason, tier: getCreditPolicy().tier });
    throw new InsightQuotaExhausted();
  }

  const overall = buildOverallStats();
  const sorted = [...MOVIES].sort((a, b) => b.total - a.total);
  const rank = sorted.findIndex(m => m.title === film.title) + 1;
  const arch = currentUser?.archetype || 'unknown';

  const catLines = CATEGORIES.map(c => {
    const score = film.scores[c.key] ?? null;
    const avg = overall[c.key] ?? null;
    if (score == null) return null;
    const delta = avg != null ? (score - avg > 0 ? `+${score - avg}` : `${score - avg}`) : '';
    return `  ${c.label}: ${score} (your avg ${avg ?? '—'}${delta ? ', ' + delta : ''})`;
  }).filter(Boolean).join('\n');

  const system = `You are a film taste analyst writing short personal score insights for a taste-tracking app called Palate Map. Write exactly 2–3 sentences. Second person only ("you", "your"). No preamble. Be direct — reference specific category scores and how they compare to the user's averages. Explain the score pattern, not the film in general.`;

  const userPrompt = `User archetype: ${arch}
Total films rated: ${MOVIES.length}

Film: ${film.title} (${film.year || '?'}) — directed by ${film.director || 'unknown'}
Total score: ${film.total} — ranked #${rank} of ${MOVIES.length}

Category scores vs your averages:
${catLines}

Write 2–3 sentences in second person about what this scoring pattern reveals about how this user experienced ${film.title}. What stood out (scored above their avg)? What fell short? Make it feel personal and specific.`;

  const text = await callClaude(system, userPrompt, 'film_insight');
  const generatedAt = new Date().toISOString();

  // Persist server-side BEFORE recording quota spend — if this fails,
  // the user keeps the text locally but doesn't lose a credit for a
  // non-durable artifact.
  const persisted = await saveGeneratedArtifact({
    contentType: 'film_insight',
    objectType: 'film',
    objectId: filmObjectId,
    objectLabel: `${film.title} (${film.year || '?'})`,
    payload: { text, total: film.total },
    summaryText: text,
    generationSource: 'film_insight',
    metadata: { total: film.total, tmdbId: film.tmdbId || null },
  });

  cache[key] = { text, filmCount: 1, total: film.total, ts: Date.now(), generatedAt };
  saveCache(cache);
  if (persisted) recordCreditUsage('insight', null, key);

  return text;
}

// ── FORCE INVALIDATE (call after score edits) ─────────────────────────────────

export function invalidateInsight(type, name) {
  const cache = loadCache();
  delete cache[`${type}::${name}`];
  saveCache(cache);
}

export function invalidateFilmInsight(title, tmdbId) {
  const cache = loadCache();
  // Remove both key formats for backward compat
  if (tmdbId) delete cache[`film::tmdb:${tmdbId}`];
  delete cache[`film::${title}`];
  saveCache(cache);
}
