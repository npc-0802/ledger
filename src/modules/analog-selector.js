// ── ANALOG SELECTOR ──────────────────────────────────────────────────────────
// Target-specific analog selection for prediction reasoning. This is the layer
// that answers "which of this reader's rated films are the most ILLUMINATING
// analogs for THIS book/film?" — not "which rated films are strong on the same
// abstract categories?" (the old, coarser failure mode where Primer kept getting
// cited because it was high on singularity/craft).
//
// Two jobs are deliberately separated:
//   - macro palate                → taste-summary.js (existing)
//   - micro analog selection      → this module (new)
//
// Method: score EVERY rated film against the target across multiple feature
// families, then assign roles (primary affirming, secondary affirming with a
// different angle, cautionary boundary case). Anti-repetition penalty stops any
// one title from becoming a universal crutch.
//
// All scoring helpers are pure and exported so they can be unit-tested without
// the DOM. selectAnalogs() reads localStorage for the repetition counter when
// available and degrades cleanly in node.

import { MOVIES, currentUser } from '../state.js';

const CAT_KEYS = ['story', 'craft', 'performance', 'world', 'experience', 'hold', 'ending', 'singularity'];

// ── Pure helpers (exported for testing) ───────────────────────────────────────

const STOP = new Set([
  'the','a','an','and','of','to','in','with','for','on','by','is','it','as','at','that','this',
  'from','but','or','his','her','their','its','was','were','are','be','about','one','who','what',
  'which','when','how','why','where','they','them','than','then','also','into','over','onto','some',
  'such','these','those','have','has','had','will','would','could','should','been','being','more',
]);

export function tokens(text) {
  if (!text) return [];
  return (String(text).toLowerCase().match(/[a-z]{4,}/g) || []).filter(t => !STOP.has(t));
}

export function jaccard(a, b) {
  const A = a instanceof Set ? a : new Set(a);
  const B = b instanceof Set ? b : new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach(x => { if (B.has(x)) inter++; });
  return inter / (A.size + B.size - inter);
}

// Tone tags = the "humanly apt" axis that raw category overlap misses. Words are
// real tone signals scraped from common synopsis/blurb language. Adding tags is
// safer than tuning weights here.
export const TONE_LEXICON = {
  paranoia:    ['paranoid', 'paranoia', 'surveillance', 'conspiracy', 'watched', 'spying'],
  identity:    ['identity', 'doppelganger', 'double', 'doubles', 'split', 'reality', 'fractured', 'self'],
  cerebral:    ['cerebral', 'clinical', 'detached', 'austere', 'intellectual', 'cold'],
  atmosphere:  ['atmospheric', 'atmosphere', 'mood', 'haunting', 'eerie', 'dread', 'gothic'],
  emotional:   ['emotional', 'tender', 'heartfelt', 'devastating', 'grief', 'intimate', 'aching'],
  puzzle:      ['puzzle', 'recursive', 'loops', 'intricate', 'knotty', 'maze', 'twist'],
  slow:        ['slow', 'contemplative', 'meditative', 'deliberate', 'quiet', 'patient'],
  visceral:    ['violent', 'visceral', 'brutal', 'intense', 'propulsive', 'kinetic'],
  political:   ['political', 'class', 'power', 'regime', 'oppression', 'resistance'],
  surreal:     ['surreal', 'dreamlike', 'absurd', 'uncanny', 'weird'],
  yearning:    ['longing', 'yearning', 'loss', 'memory', 'nostalgia', 'wistful'],
};

export function toneTags(text) {
  const out = new Set();
  if (!text) return out;
  const lower = String(text).toLowerCase();
  for (const [tag, words] of Object.entries(TONE_LEXICON)) {
    if (words.some(w => lower.includes(w))) out.add(tag);
  }
  return out;
}

export function toneOverlap(a, b) {
  const A = a instanceof Set ? a : new Set(a);
  const B = b instanceof Set ? b : new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  A.forEach(t => { if (B.has(t)) inter++; });
  return inter / Math.max(A.size, B.size);
}

export function cosine(a, b) {
  let dot = 0, am = 0, bm = 0;
  for (const k of CAT_KEYS) {
    const x = a?.[k] || 0, y = b?.[k] || 0;
    dot += x * y; am += x * x; bm += y * y;
  }
  return (am && bm) ? dot / (Math.sqrt(am) * Math.sqrt(bm)) : 0;
}

// Emphasis vector for a rated film: each category's score relative to that film's
// own mean (so a film "leans on" the categories that stick out within it). This
// captures shape, not absolute level.
export function scoreShape(film) {
  const scores = film?.scores || {};
  const vals = CAT_KEYS.map(k => scores[k]).filter(v => v != null);
  if (!vals.length) return Object.fromEntries(CAT_KEYS.map(c => [c, 0]));
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const maxDev = Math.max(...vals.map(v => v - mean)) || 1;
  const out = {};
  for (const k of CAT_KEYS) {
    const v = scores[k];
    out[k] = (v != null) ? Math.max(0, (v - mean) / maxDev) : 0;
  }
  return out;
}

// ── Anti-repetition counter (localStorage; node-safe) ────────────────────────

const USE_KEY = 'palatemap_analog_use_v1';

function hasLS() { return typeof localStorage !== 'undefined'; }
function readUses() {
  if (!hasLS()) return {};
  try { return JSON.parse(localStorage.getItem(USE_KEY) || '{}') || {}; } catch { return {}; }
}
function writeUses(map) {
  if (!hasLS()) return;
  try { localStorage.setItem(USE_KEY, JSON.stringify(map)); } catch { /* non-fatal */ }
}

export function repetitionPenalty(id, now = Date.now()) {
  if (!id) return 0;
  const u = readUses()[id];
  if (!u) return 0;
  const count = u.count || 0;
  const hoursSince = (now - (u.lastAt || 0)) / 3600000;
  const recencyBoost = hoursSince < 1 ? 0.18 : hoursSince < 24 ? 0.07 : 0;
  return Math.min(0.55, 0.10 * Math.log2(1 + count) + recencyBoost);
}

function recordUse(ids) {
  if (!hasLS()) return;
  const map = readUses();
  const now = Date.now();
  ids.filter(Boolean).forEach(id => {
    map[String(id)] = { count: (map[String(id)]?.count || 0) + 1, lastAt: now };
  });
  writeUses(map);
}

// ── Target feature extraction (caller supplies dims/text) ────────────────────

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function definingPositiveCats(userWeights) {
  const out = [];
  for (const k of CAT_KEYS) {
    const w = userWeights?.[k] ?? 2.5;
    if (w - 2.5 >= 0.3) out.push({ cat: k, dev: w - 2.5 });
  }
  return out.sort((a, b) => b.dev - a.dev).map(d => d.cat);
}

// Boundary signal: candidate is strong in one of the user's defining-positive
// categories yet only mid-rated overall ("admired but not loved" / partial fit).
function boundarySignal(film, defPos) {
  if (!defPos?.length || !film?.scores) return 0;
  const total = film.total ?? 0;
  if (total < 55 || total > 74) return 0;
  let strong = 0;
  for (const c of defPos.slice(0, 3)) {
    const v = film.scores[c];
    if (v != null && v >= 80) strong++;
  }
  return strong > 0 ? Math.min(0.6, 0.25 * strong) : 0;
}

const candidateText = (m) =>
  `${m?.title || ''} ${m?.overview || ''} ${m?.genres || ''} ${m?.director || ''} ${m?.cast || ''}`;

const filmId = (m) => String(m?.tmdbId || m?._tmdbId || m?.title || '');

// ── The scoring + selection orchestrator ─────────────────────────────────────

/**
 * Score every rated candidate against the target across feature families and
 * return chosen analogs in roles. Pure-ish (only side effect is bumping the
 * repetition counter for chosen analogs at the end).
 *
 * @param {object} opts
 * @param {object} opts.target       - the film/book being predicted
 * @param {'film'|'book'} opts.medium
 * @param {object} opts.targetDims   - 0..1 per-category emphasis vector for the target
 * @param {string} opts.targetText   - free text from the target (title+description+subjects/genres)
 * @param {Array}  [opts.movies]     - rated candidate pool (default MOVIES)
 * @param {object} [opts.userWeights]
 * @param {boolean}[opts.recordUsage=true] - bump anti-repetition counter on the chosen analogs
 *
 * @returns {{ primary, secondary, cautionary, diagnostics }}
 *   each chosen field is { film, role, reason, features } or null
 */
export function selectAnalogs({ target, medium, targetDims, targetText, movies = MOVIES, userWeights = currentUser?.weights, recordUsage = true } = {}) {
  const rated = (movies || []).filter(m => m?.scores && m.total != null);
  // Don't analogize a film to itself.
  const targetTmdb = target?.tmdbId ? String(target.tmdbId) : null;
  const pool = targetTmdb ? rated.filter(m => filmId(m) !== targetTmdb) : rated;

  if (!pool.length) {
    return { primary: null, secondary: null, cautionary: null, diagnostics: { reason: 'no rated candidates' } };
  }

  const tgtTokens = new Set(tokens(targetText));
  const tgtTones = toneTags(targetText);
  const defPos = definingPositiveCats(userWeights);
  const totals = pool.map(m => m.total);
  const med = median(totals);

  // Score every candidate.
  const scored = pool.map(m => {
    const id = filmId(m);
    const dimRes = cosine(targetDims || {}, scoreShape(m));
    const candTokens = new Set(tokens(candidateText(m)));
    const thematic = jaccard(tgtTokens, candTokens);
    const candTones = toneTags(candidateText(m));
    const tone = toneOverlap(tgtTones, candTones);
    const likedBoost = Math.max(0, Math.min(1, (m.total - 70) / 30));
    const boundary = boundarySignal(m, defPos);
    const rep = repetitionPenalty(id);

    // Affirming objective: relevance + (modest) liked weight − repetition.
    const affirmScore = 0.32 * dimRes + 0.30 * thematic + 0.28 * tone + 0.20 * likedBoost - rep;
    // Cautionary objective: thematic/tone relevance + boundary signal − lighter
    // repetition penalty (caution slots rotate more naturally).
    const cautionScore = 0.30 * thematic + 0.25 * tone + 0.10 * dimRes + 0.55 * boundary - rep * 0.5;

    return { film: m, id, candTones, features: { dimRes, thematic, tone, likedBoost, boundary, repetitionPenalty: rep }, affirmScore, cautionScore };
  });

  const byAffirm = [...scored].sort((a, b) => b.affirmScore - a.affirmScore);
  const primary = byAffirm[0] || null;

  // Secondary picks a DIFFERENT angle: boost candidates whose tone tags don't
  // duplicate the primary's, then re-rank.
  let secondary = null;
  if (primary) {
    const pTones = primary.candTones;
    const adjusted = byAffirm.slice(1).map(c => {
      let overlap = 0; pTones.forEach(t => { if (c.candTones.has(t)) overlap++; });
      const diversityBoost = pTones.size ? (1 - overlap / Math.max(1, pTones.size)) * 0.10 : 0;
      return { ...c, _adj: c.affirmScore + diversityBoost };
    }).sort((a, b) => b._adj - a._adj);
    secondary = adjusted[0] || null;
  }

  // Cautionary: prefer items below the median total or with a boundary signal,
  // excluding the already-chosen analogs.
  const usedIds = new Set([primary?.id, secondary?.id].filter(Boolean));
  const cautionPool = scored.filter(c => !usedIds.has(c.id) && (c.film.total < med || c.features.boundary > 0.2));
  const cautionary = cautionPool.sort((a, b) => b.cautionScore - a.cautionScore)[0] || null;

  const decorate = (entry, role) => entry ? {
    film: entry.film, role,
    reason: analogReason(entry, tgtTones, targetDims, role === 'cautionary'),
    features: entry.features,
  } : null;

  const chosen = {
    primary: decorate(primary, 'primary'),
    secondary: decorate(secondary, 'secondary'),
    cautionary: decorate(cautionary, 'cautionary'),
  };

  if (recordUsage) recordUse([primary?.id, secondary?.id, cautionary?.id]);

  const diagnostics = {
    target: { medium, dims: targetDims, tones: [...tgtTones], tokensSample: [...tgtTokens].slice(0, 12) },
    candidatesTop: byAffirm.slice(0, 8).map(c => ({
      title: c.film.title, total: c.film.total,
      affirmScore: round(c.affirmScore), cautionScore: round(c.cautionScore),
      ...Object.fromEntries(Object.entries(c.features).map(([k, v]) => [k, round(v)])),
    })),
    chosen: {
      primary: chosen.primary && { title: chosen.primary.film.title, reason: chosen.primary.reason },
      secondary: chosen.secondary && { title: chosen.secondary.film.title, reason: chosen.secondary.reason },
      cautionary: chosen.cautionary && { title: chosen.cautionary.film.title, reason: chosen.cautionary.reason },
    },
    pool: pool.length,
  };

  return { primary: chosen.primary, secondary: chosen.secondary, cautionary: chosen.cautionary, diagnostics };
}

function round(x) { return Math.round((x || 0) * 100) / 100; }

// Short human reason for the analog, derived from its dominant feature.
function analogReason(entry, targetTones, targetDims, isCaution) {
  const f = entry.features;
  const sharedTones = [];
  entry.candTones.forEach(t => { if (targetTones.has(t)) sharedTones.push(t); });
  if (isCaution) {
    if (f.boundary > 0.2) return 'admired but didn\'t fully land — sits near a fault line';
    if (sharedTones.length) return `shared ${sharedTones.slice(0, 2).join(' + ')} territory but cooled on it`;
    return 'thematic overlap, lower personal hit';
  }
  if (sharedTones.length >= 2) return `shared ${sharedTones.slice(0, 2).join(' + ')} register`;
  if (sharedTones.length === 1) return `shared ${sharedTones[0]} register`;
  if (f.thematic > 0.05) return 'thematic overlap';
  if (f.dimRes > 0.5) {
    const topCat = Object.entries(targetDims || {}).sort((a, b) => b[1] - a[1])[0]?.[0];
    return topCat ? `category shape matches (${topCat})` : 'category shape matches';
  }
  return 'closest available analog';
}

// ── Prompt formatter ─────────────────────────────────────────────────────────
export function formatAnalogsForPrompt(analogs, medium = 'film') {
  if (!analogs) return '';
  const lines = [];
  const fmt = (a, label) => a ? `- ${label} · ${a.film.title} (${Math.round(a.film.total)}) — ${a.reason}` : null;
  const p = fmt(analogs.primary, 'Primary fit');
  const s = fmt(analogs.secondary, 'Also fits');
  const c = fmt(analogs.cautionary, 'Boundary case');
  [p, s, c].forEach(l => l && lines.push(l));
  if (!lines.length) return '';
  const noun = medium === 'book' ? 'book' : 'film';
  return `\nANALOGS FROM YOUR RATED FILMS (chosen specifically for this ${noun}):\n${lines.join('\n')}`;
}
