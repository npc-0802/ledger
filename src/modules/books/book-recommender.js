// ── BOOK RECOMMENDER — STAGED PIPELINE ───────────────────────────────────────
// An explicit, inspectable recommendation funnel for books:
//
//   Stage A  Taste-shaped retrieval   broad candidate pool from Open Library,
//                                      queried by the user's defining preferences
//   Stage B  Cheap reranking          deterministic, multi-feature; produces TWO
//                                      objectives — safe_score and upside_score
//   Stage C  Batch curation (opt-in)  ONE Claude pass over the top candidates →
//                                      reasoned safe/upside shortlists (cached)
//   Stage D  Per-item prediction       lives in book-predict.js, metered, on demand
//
// Stages A+B are free, local-ish, and cached by profile fingerprint. Stage C is a
// single metered call (credit_source 'book_curate'), cached aggressively so it's
// economical for the public product. Stage D is unchanged.
//
// Design intent (for future Lever C / distillation): retrieval, cheap scoring, and
// curation are deliberately separate, and their outputs are structured + logged,
// so logged curations/predictions can later train a local reranker that
// approximates the deep layer.

import { currentUser, MOVIES } from '../../state.js';
import { track } from '../../analytics.js';
import { sb, saveGeneratedArtifact, loadGeneratedArtifact } from '../supabase.js';
import { syncCreditsFromResponse } from '../credit-policy.js';
import { buildTasteSummary, formatTasteSummary } from '../taste-summary.js';
import { getCategoryLabel } from '../../data/category-descriptions.js';
import { inferBookDimensions, bookMatchScore } from './book-tags.js';
import { searchBooksBySubject, getBookKey, coverFromISBN } from './book-api.js';
import { buildSubjectQueries, moodSubjects } from './book-queries.js';
import { BOOKS_CATALOG } from '../../data/books-catalog.js';
import { parseCurationJSON, normalizeCuration } from './curation-parse.js';
import { directionalFeatures } from '../scoring/shape-fit.js';
import { bookSeriesInfo } from '../series-metadata.js';

const PROXY_URL = 'https://palate-map-proxy.noahparikhcott.workers.dev';
export const RECO_METHOD_VERSION = 'reco_v1';
export const BOOK_CURATE_SOURCE = 'book_curate';
const BOOK_CURATE_MAX_TOKENS = 2400;

// Pipeline sizing (per the method spec).
const PER_QUERY_LIMIT = 20;     // candidates fetched per subject query
const RERANK_KEEP = 40;         // pool size handed to curation
const SAFE_SHELF = 24;          // assembled safe pool (UI reveals a slice)
const UPSIDE_SHELF = 12;        // assembled upside pool
const CURATE_SAFE = 8;
const CURATE_UPSIDE = 8;

// Cache — a fingerprint→shelf map so multiple moods coexist (v2: keyed map).
const SHELF_CACHE_KEY = 'palatemap_book_shelf_v2';
const SHELF_TTL_MS = 5 * 24 * 60 * 60 * 1000; // 5 days
const SHELF_CACHE_MAX = 8;                     // distinct shelves kept (per mood/profile)

const bookLabel = k => getCategoryLabel(k, 'book').replace(/^The\s+/i, '');
const CAT_KEYS = ['story', 'craft', 'performance', 'world', 'experience', 'hold', 'ending', 'singularity'];

// ── Profile fingerprint (cache key + artifact id + future training key) ───────
// Keyed to the WHOLE current profile (not just count + rounded weights): folds in
// confidence-weighted category averages and the defining +/- preference sets, so
// re-rating busts the cache. Mood is part of identity, so each lane caches/curates
// independently (All ≠ Sci-fi ≠ Thriller).
export function profileFingerprint(summary = null, mood = 'all') {
  const s = summary || buildTasteSummary({ medium: 'book' });
  const w = currentUser?.weights || {};
  const wStr = CAT_KEYS.map(k => Math.round((w[k] ?? 2.5) * 2) / 2).join(',');
  const avg = CAT_KEYS.map(k => Math.round((s.categoryAverages[k] ?? 0) / 2)).join(',');
  const pos = (s.definingPositive || []).map(d => d.cat).join('');
  const neg = (s.definingNegative || []).map(d => d.cat).join('');
  return `${RECO_METHOD_VERSION}|m${mood || 'all'}|n${MOVIES.length}|w${wStr}|a${avg}|p${pos}|x${neg}`;
}

// ── Cache helpers (fingerprint-keyed map) ─────────────────────────────────────
function readShelfMap() {
  try { return JSON.parse(localStorage.getItem(SHELF_CACHE_KEY) || '{}') || {}; } catch { return {}; }
}
function readShelfEntry(fp) { return readShelfMap()[fp] || null; }
function writeShelfEntry(fp, entry) {
  const map = readShelfMap();
  map[fp] = entry;
  const keys = Object.keys(map);
  if (keys.length > SHELF_CACHE_MAX) {
    keys.sort((a, b) => (map[a].at || 0) - (map[b].at || 0));
    keys.slice(0, keys.length - SHELF_CACHE_MAX).forEach(k => delete map[k]);
  }
  try { localStorage.setItem(SHELF_CACHE_KEY, JSON.stringify(map)); } catch { /* non-fatal */ }
}
function cacheValid(entry, fp) {
  return entry && entry.fingerprint === fp && entry.methodVersion === RECO_METHOD_VERSION &&
    (Date.now() - (entry.at || 0)) < SHELF_TTL_MS;
}

// Does a catalog book belong to the selected mood lane? (keeps the lane clean)
function bookMatchesMood(book, mood) {
  if (!mood || mood === 'all') return true;
  const terms = moodSubjects(mood);
  if (!terms.length) return true;
  const subj = [...(book.categories || []), ...(book.subjects || [])].map(s => String(s).toLowerCase());
  return terms.some(t => subj.some(s => s.includes(t) || t.includes(s)));
}

// ── Series hygiene ────────────────────────────────────────────────────────────
// Recommender default: prefer standalone books and #1 entries; suppress books we
// can reliably identify as a later entry in a series. This is hygiene, not a ban:
// direct search/lookup/predict for the same book still works.
//
// Floor: if filtering would leave the pool too thin, we allow later entries back
// in (graceful fallback rather than empty shelves). The floor is generous enough
// that a normal taste profile never hits it.
const SERIES_POOL_FLOOR = 12;

function partitionSeriesEntries(pool) {
  const allowed = [];
  const later = [];
  for (const b of pool) {
    const info = bookSeriesInfo(b);
    if (info?.isLaterSeriesEntry) later.push(b); else allowed.push(b);
  }
  return { allowed, later };
}

// ── Stage A: retrieval ────────────────────────────────────────────────────────
async function retrieveCandidates(queries, mood = 'all') {
  const settled = await Promise.allSettled(
    queries.map(q => searchBooksBySubject(q.subject, { limit: PER_QUERY_LIMIT }).then(docs => ({ q, docs })))
  );
  const byKey = new Map();
  for (const r of settled) {
    if (r.status !== 'fulfilled') continue;
    const { q, docs } = r.value;
    for (const d of docs) {
      const key = getBookKey(d);
      if (!key) continue;
      if (!byKey.has(key)) byKey.set(key, { ...d, bookKey: key, _queries: [], _appearances: 0 });
      const e = byKey.get(key);
      e._appearances++;
      if (!e._queries.includes(q.family)) e._queries.push(q.family);
      // merge subjects from later appearances (evidence, not duplicates)
      if (d.subjects?.length && e.subjects?.length < 24) {
        e.subjects = [...new Set([...(e.subjects || []), ...d.subjects])].slice(0, 24);
      }
    }
  }
  // Seed/supplement with the curated local catalog so the shelf never collapses.
  // In a mood lane, only seed catalog books that belong to the lane (keeps it clean).
  for (const b of BOOKS_CATALOG) {
    const book = { medium: 'book', ...b, cover: coverFromISBN(b.isbn) };
    if (!bookMatchesMood(book, mood)) continue;
    const key = getBookKey(book);
    if (!byKey.has(key)) byKey.set(key, { ...book, bookKey: key, _queries: ['seed'], _appearances: 1 });
  }
  return [...byKey.values()];
}

// ── Stage B: cheap multi-feature rerank ───────────────────────────────────────
// Two distinct objectives: safe_score (alignment + confidence, low boundary risk)
// vs upside_score (peak spikes, singularity/hold, rating ceiling — tolerates lower
// certainty). Feature contributions are kept on each item for inspection.
function rerankCandidates(pool, summary, weights, querySubjects) {
  const interest = querySubjects;
  // negCats logic now lives inside shape-fit's directionalFeatures(boundary path).

  return pool.map(book => {
    const dims = inferBookDimensions(book);

    // ── Directional taste-shape (SHARED with film recommender via shape-fit) ──
    const ratingCeil = book.ratingsAverage != null ? Math.max(0, Math.min(1, (book.ratingsAverage - 3.8) / 1.2)) : 0;
    const dir = directionalFeatures({ candidateDims: dims, summary, userWeights: weights, ceilingSignal: ratingCeil });
    const topDims = Object.entries(dims).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
    const boundaryPenalty = dir.boundaryPenalty;   // same philosophy as film
    const upsideTerm = dir.upsideTerm;             // same philosophy as film
    const peak = dir.peakiness;                    // same philosophy as film

    // ── Book-specific signals ─────────────────────────────────────────────────
    // 1. Category alignment (cosine of book emphasis vs user weights)
    const alignment = bookMatchScore(book, weights);
    // 2. Subject/genre affinity vs taste-derived interest subjects
    const subj = [...(book.subjects || []), ...(book.categories || [])].map(s => String(s).toLowerCase());
    const hits = subj.filter(s => interest.some(i => s.includes(i) || i.includes(s))).length;
    const subjectAffinity = Math.min(1, hits / 3);
    // 5. Metadata quality / confidence
    const metaQuality = Math.min(1,
      (book.description ? 0.35 : 0) + (book.pageCount ? 0.15 : 0) +
      ((book.subjects?.length || book.categories?.length) ? 0.25 : 0) +
      (book.ratingsCount ? Math.min(1, book.ratingsCount / 400) * 0.25 : 0));
    // 6. Retrieval provenance (multi-query appearance + upside-family origin)
    const provenance = Math.min(0.2, Math.max(0, (book._appearances || 1) - 1) * 0.05) +
      ((book._queries || []).includes('upside') ? 0.05 : 0);

    const baseFit = Math.max(0, 0.6 * alignment + 0.4 * subjectAffinity - boundaryPenalty + provenance);
    const safeScore = baseFit * (0.55 + 0.45 * metaQuality);
    const upsideScore = 0.4 * baseFit + 0.85 * upsideTerm +
      ((book._queries || []).includes('upside') ? 0.08 : 0) - boundaryPenalty * 0.5;

    return {
      book: { ...book, cover: book.cover || coverFromISBN(book.isbn) },
      dims, topDims, baseFit, safeScore, upsideScore,
      features: { alignment, subjectAffinity, boundaryPenalty, upsideTerm, metaQuality, provenance, peak },
    };
  }).sort((a, b) => b.baseFit - a.baseFit);
}

// ── Diversity-controlled shelf assembly ───────────────────────────────────────
function pickDiverse(items, scoreKey, n, excludeKeys = new Set()) {
  const out = [];
  const authorCount = {};
  const sigCount = {};
  for (const it of [...items].sort((a, b) => b[scoreKey] - a[scoreKey])) {
    const b = it.book;
    if (excludeKeys.has(b.bookKey)) continue;
    const author = (b.author || '').toLowerCase();
    if (author && (authorCount[author] || 0) >= 1) continue; // one per author → spread
    const sig = (b.subjects || b.categories || []).slice(0, 2).map(s => String(s).toLowerCase()).sort().join('|');
    if (sig && (sigCount[sig] || 0) >= 2) continue;          // cap near-identical niches
    out.push(it);
    if (author) authorCount[author] = (authorCount[author] || 0) + 1;
    if (sig) sigCount[sig] = (sigCount[sig] || 0) + 1;
    if (out.length >= n) break;
  }
  return out;
}

function safeReason(it) {
  const labels = it.topDims.slice(0, 2).map(bookLabel);
  return `Strong fit · ${labels.join(' + ')}`;
}
function upsideReason(it) {
  const basis = [];
  if ((it.dims.singularity || 0) >= 0.7) basis.push('singular');
  if ((it.dims.hold || 0) >= 0.7) basis.push('adhesive');
  if (it.features.peak >= 0.4 && !basis.length) basis.push(`${bookLabel(it.topDims[0])} spike`);
  if (!basis.length) basis.push(bookLabel(it.topDims[0]));
  return `Could spike · ${basis.join(' + ')}`;
}

function toShelfBook(it, shelf, reason) {
  return { ...it.book, bookKey: it.book.bookKey, shelf, reason,
    _safeScore: Math.round(it.safeScore * 100) / 100, _upsideScore: Math.round(it.upsideScore * 100) / 100 };
}

function assembleShelves(reranked) {
  const safe = pickDiverse(reranked, 'safeScore', SAFE_SHELF).map(it => toShelfBook(it, 'safe', safeReason(it)));
  const safeKeys = new Set(safe.map(b => b.bookKey));
  const upside = pickDiverse(reranked, 'upsideScore', UPSIDE_SHELF, safeKeys).map(it => toShelfBook(it, 'upside', upsideReason(it)));
  return { safe, upside };
}

// How often a valid-but-UNCURATED local shelf re-probes the server for a paid
// curated shelf (one created on another device/browser). Bounds the extra query
// to ~once per window per device instead of every tab open.
const SERVER_RECHECK_MS = 6 * 60 * 60 * 1000; // 6 hours

// Restore a server-persisted (paid) curated shelf for this fingerprint, if any.
async function tryServerCuratedShelf(fp) {
  try {
    const artifact = await loadGeneratedArtifact('book_shelf', fp);
    if (artifact?.payload?.safe) {
      const hydrated = {
        fingerprint: fp, methodVersion: RECO_METHOD_VERSION, at: Date.now(),
        safe: artifact.payload.safe, upside: artifact.payload.upside || [],
        candidates: artifact.payload.candidates || null,
        diagnostics: artifact.payload.diagnostics || null,
        curatedAt: artifact.payload.curatedAt || artifact.generated_at || null,
      };
      writeShelfEntry(fp, hydrated);
      return hydrated;
    }
  } catch { /* ignore — caller falls back */ }
  return null;
}
const shelfResult = (h, fromServer) => ({ safe: h.safe || [], upside: h.upside || [], curatedAt: h.curatedAt || null, diagnostics: h.diagnostics, fromCache: true, ...(fromServer ? { fromServer: true } : {}) });

// ── Public: get the shelves, cached per (profile, mood) fingerprint ───────────
export async function getBookShelf({ force = false, mood = 'all' } = {}) {
  const summary = buildTasteSummary({ medium: 'book' });
  const fp = profileFingerprint(summary, mood);
  const cache = readShelfEntry(fp);

  if (!force && cacheValid(cache, fp)) {
    // A locally-curated shelf is the freshest paid result here — serve it.
    if (cache.curatedAt) return shelfResult(cache);
    // Valid but UNCURATED: a curated shelf may have been paid for on another
    // device. Prefer it over a local free shelf. Throttle the probe so the free
    // path doesn't hit the network on every open.
    const due = !cache.serverCheckedAt || (Date.now() - cache.serverCheckedAt) > SERVER_RECHECK_MS;
    if (due) {
      const hydrated = await tryServerCuratedShelf(fp);
      if (hydrated) return shelfResult(hydrated, true);
      writeShelfEntry(fp, { ...cache, serverCheckedAt: Date.now() }); // remember we looked
    }
    return shelfResult(cache);
  }

  // Local miss: a PAID curated shelf may still live server-side (durable across
  // devices/browsers). Restore it for free before rebuilding from scratch.
  if (!force) {
    const hydrated = await tryServerCuratedShelf(fp);
    if (hydrated) return shelfResult(hydrated, true);
  }

  const queries = buildSubjectQueries(summary, mood);
  const rawPool = await retrieveCandidates(queries, mood);
  // Series hygiene: pull later-in-series entries out of the recommender pool by
  // default. Falls back to including them only if the remaining pool would be
  // too thin to assemble a usable shelf.
  const { allowed, later } = partitionSeriesEntries(rawPool);
  const pool = allowed.length >= SERIES_POOL_FLOOR ? allowed : [...allowed, ...later];
  const reranked = rerankCandidates(pool, summary, currentUser?.weights || null, queries.map(q => q.subject));
  const { safe, upside } = assembleShelves(reranked);

  // True top-N reranked candidates (by baseFit), retained so Stage C curation can
  // reason over the FULL strong pool — not just the diversity-capped shelves.
  const candidates = reranked.slice(0, RERANK_KEEP).map(it => {
    const lane = it.safeScore >= it.upsideScore ? 'safe' : 'upside';
    return toShelfBook(it, lane, lane === 'safe' ? safeReason(it) : upsideReason(it));
  });

  const diagnostics = {
    retrievalPool: rawPool.length,
    seriesSuppressed: rawPool.length - pool.length,
    seriesFallbackTriggered: allowed.length < SERIES_POOL_FLOOR,
    rerankedPool: reranked.length,
    keptForCuration: candidates.length,
    safeN: safe.length,
    upsideN: upside.length,
    overlap: safe.filter(s => upside.some(u => u.bookKey === s.bookKey)).length,
    queryFamilies: queries.reduce((acc, q) => { acc[q.family] = (acc[q.family] || 0) + 1; return acc; }, {}),
    queries: queries.map(q => q.subject),
    mood,
  };

  // Free shelves cached locally only (not paid → no server artifact). Curation
  // overlay reset on rebuild.
  writeShelfEntry(fp, { fingerprint: fp, methodVersion: RECO_METHOD_VERSION, at: Date.now(), safe, upside, candidates, diagnostics, curatedAt: null });
  if (typeof window !== 'undefined') window.__bookReco = { diagnostics, reranked, queries, fingerprint: fp, mood };
  track('book_shelf_built', diagnostics);

  return { safe, upside, curatedAt: null, diagnostics, fromCache: false };
}

// ── Stage C: batch curation (one metered Claude call, cached) ─────────────────
function compactCandidate(b) {
  const dims = inferBookDimensions(b);
  const top = Object.entries(dims).sort((a, c) => c[1] - a[1]).slice(0, 3).map(([k]) => bookLabel(k)).join('/');
  const subj = (b.subjects || b.categories || []).slice(0, 4).join(', ');
  return `[${b.bookKey}] ${b.title}${b.author ? ' — ' + b.author : ''}${b.year ? ' (' + b.year + ')' : ''} · dims: ${top}${subj ? ' · ' + subj : ''}`;
}

/**
 * Run one reasoned curation pass over the current shelf candidates. Metered
 * (credit_source 'book_curate'), result cached on the shelf by fingerprint.
 * @returns {Promise<{ safe, upside, curatedAt }>}
 */
export async function curateBookShelf(shelf, mood = 'all') {
  const summary = buildTasteSummary({ medium: 'book' });
  const fp = profileFingerprint(summary, mood);
  // Curate the TRUE top reranked pool (by baseFit) for THIS mood, not the
  // diversity-capped shelves — so a strong book pruned during assembly is still
  // reachable here, letting Stage C correct Stage B selection mistakes. Falls back
  // to the visible shelves only if the candidate pool wasn't cached.
  const cached = readShelfEntry(fp);
  const seen = new Set();
  const candidates = (cached?.candidates?.length ? cached.candidates : [...shelf.safe, ...shelf.upside])
    .filter(b => { if (seen.has(b.bookKey)) return false; seen.add(b.bookKey); return true; })
    .slice(0, RERANK_KEEP);
  const byKey = new Map(candidates.map(b => [b.bookKey, b]));

  const system = `You are a literary recommendation curator. Given a reader's full taste profile and a candidate shelf, select TWO ranked shortlists: SAFE picks (high-confidence strong fit) and UPSIDE picks (higher variance, lower certainty, but real potential to become a favorite — a 90+/obsession, not just a solid fit). Reason from the whole profile. Curate; do not write reviews. Respond ONLY with valid JSON.`;

  const user = `${formatTasteSummary(summary, 'book')}

CANDIDATES (choose only from these book keys):
${candidates.map(compactCandidate).join('\n')}

TASK: Return ${CURATE_SAFE} safe picks and ${CURATE_UPSIDE} upside picks, ranked. Safe = strong fit + high confidence ("yes, this is me"). Upside = higher ceiling / favorite-energy even if less certain. The two lists MUST be disjoint — never place the same book in both; if a book qualifies for both, put it only in the stronger lane. Keep each "why" to ONE clause, under 12 words — shelf-curation style, not a review.

OUTPUT RULES (strict):
- Respond with ONE JSON object and NOTHING ELSE — no prose before or after, no markdown, no code fences, no comments.
- "confidence" is a number between 0 and 1.
- "book_key" must come verbatim from the candidate list above.
- No trailing commas. No ellipses. Do not truncate.

JSON shape (exact keys):
{"safe_picks":[{"book_key":"<key>","rank":1,"why":"<short>","fit_dimensions":["<dim>"],"confidence":0.0}],"upside_picks":[{"book_key":"<key>","rank":1,"why":"<short>","upside_basis":"<short>","confidence":0.0}]}`;

  const headers = { 'Content-Type': 'application/json' };
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  } catch {}

  const res = await fetch(PROXY_URL, {
    method: 'POST', headers,
    body: JSON.stringify({
      system,
      messages: [{ role: 'user', content: user }],
      credit_source: BOOK_CURATE_SOURCE,
      // The shelf curation payload is a fairly long JSON object (8 safe + 8
      // upside picks). The proxy defaults to 1024 max_tokens, which can cut off
      // the response mid-object and make even a robust parser fail after the
      // user has already spent a credit.
      max_tokens: BOOK_CURATE_MAX_TOKENS,
    }),
  });
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); } catch { throw new Error(`Curation proxy returned invalid response (HTTP ${res.status}).`); }
  if (data._credits) syncCreditsFromResponse(data._credits);
  if (data.error === 'quota_exceeded' || data.error === 'plan_restricted' || data.error === 'auth_required' || data.error === 'quota_service_error') {
    throw new Error(data.message || 'Curation blocked by server policy.');
  }
  if (data.type === 'error' || data.error) throw new Error(`Curation API error: ${data.error?.message || data.error || 'unknown'}`);
  if (!data.content?.length) throw new Error('Curation returned an empty response.');

  // ── Parse + normalize (the user has already been charged here) ────────────
  // Use a salvage-capable parser + normalizer; preserve raw + context on failure
  // so the wasted credit is at least diagnosable.
  const rawText = Array.isArray(data.content)
    ? data.content
      .filter(block => block?.type === 'text' && typeof block.text === 'string')
      .map(block => block.text.trim())
      .filter(Boolean)
      .join('\n')
    : '';
  const parsed = parseCurationJSON(rawText);
  const normalized = parsed ? normalizeCuration(parsed) : null;
  const fpForLog = profileFingerprint(summary, mood);
  if (!normalized) {
    if (typeof window !== 'undefined') {
      window.__bookCurateError = {
        rawPreview: rawText.slice(0, 2000),
        fingerprint: fpForLog,
        mood,
        candidates: candidates.length,
        stopReason: data.stop_reason || null,
        contentTypes: Array.isArray(data.content) ? data.content.map(b => b?.type || null) : [],
        at: new Date().toISOString(),
      };
    }
    console.warn('[book-curate] unparseable/empty curation response', {
      fingerprint: fpForLog,
      mood,
      candidates: candidates.length,
      stopReason: data.stop_reason || null,
      contentTypes: Array.isArray(data.content) ? data.content.map(b => b?.type || null) : [],
      rawPreview: rawText.slice(0, 300),
    });
    track('book_curate_parse_failed', {
      mood,
      candidates: candidates.length,
      raw_length: rawText.length,
      stop_reason: data.stop_reason || null,
    });
    if (data.stop_reason === 'max_tokens') {
      throw new Error('Curation ran long and got cut off. Please try again.');
    }
    throw new Error('Curation ran into a formatting issue. Please try again.');
  }

  // Map normalized picks back to full book objects, in curated order.
  const mapPicks = (picks, shelfName) => picks
    .map(p => {
      const b = byKey.get(p.book_key);
      if (!b) return null;
      return { ...b, shelf: shelfName, reason: p.why || b.reason, _rank: p.rank ?? null,
        _confidence: p.confidence, _why: p.why || null,
        _fitDimensions: p.fit_dimensions || null, _upsideBasis: p.upside_basis || null };
    })
    .filter(Boolean);

  const curatedSafe = mapPicks(normalized.safe_picks, 'safe');
  const curatedUpside = mapPicks(normalized.upside_picks, 'upside');

  // ── Lane integrity: a book may never appear in both shelves ────────────────
  // Hard, deterministic dedupe (the prompt only "prefers" disjoint lists). For a
  // book the model put in both lanes, keep it where its rank is better; ties go
  // to Safe (the higher-confidence intent).
  const safeRank = new Map(normalized.safe_picks.map(p => [p.book_key, p.rank ?? 999]));
  const upRank = new Map(normalized.upside_picks.map(p => [p.book_key, p.rank ?? 999]));
  const inBoth = new Set(curatedSafe.map(b => b.bookKey).filter(k => curatedUpside.some(u => u.bookKey === k)));
  const keepInSafe = k => (safeRank.get(k) ?? 999) <= (upRank.get(k) ?? 999);

  let safe = curatedSafe.filter(b => !inBoth.has(b.bookKey) || keepInSafe(b.bookKey));
  let upside = curatedUpside.filter(b => !inBoth.has(b.bookKey) || !keepInSafe(b.bookKey));
  // Belt-and-suspenders: no key survives in both lists.
  const safeKeySet = new Set(safe.map(b => b.bookKey));
  upside = upside.filter(b => !safeKeySet.has(b.bookKey));

  // Backfill to the intended lengths from the free shelves, never reintroducing a
  // book already used in either lane. Falls back to free shelves entirely if the
  // model returned nothing usable for a lane.
  const targetSafe = curatedSafe.length || Math.min(CURATE_SAFE, shelf.safe?.length || 0);
  const targetUpside = curatedUpside.length || Math.min(CURATE_UPSIDE, shelf.upside?.length || 0);
  const used = new Set([...safe, ...upside].map(b => b.bookKey));
  for (const b of (shelf.safe || [])) {
    if (safe.length >= targetSafe) break;
    if (used.has(b.bookKey)) continue;
    safe.push(b); used.add(b.bookKey);
  }
  for (const b of (shelf.upside || [])) {
    if (upside.length >= targetUpside) break;
    if (used.has(b.bookKey)) continue;
    upside.push(b); used.add(b.bookKey);
  }

  const curatedAt = new Date().toISOString();
  const cache = readShelfEntry(fp) || {};

  // Persist curation overlay locally (instant reopen)…
  writeShelfEntry(fp, { ...cache, fingerprint: fp, methodVersion: RECO_METHOD_VERSION,
    at: cache.at || Date.now(), safe, upside, candidates, diagnostics: cache.diagnostics, curatedAt });

  // …and durably server-side (this shortlist was PAID for). Awaited, persistence-
  // first, so it survives a browser/device switch or cleared storage. Keyed by the
  // profile fingerprint so it's restored only while it still matches the reader.
  const persisted = await saveGeneratedArtifact({
    contentType: 'book_shelf',
    objectType: 'profile',
    objectId: fp,
    objectLabel: `Curated book shelf · ${currentUser?.archetype || 'reader'}`,
    payload: { safe, upside, candidates, curatedAt, diagnostics: cache.diagnostics || null },
    generationSource: BOOK_CURATE_SOURCE,
    metadata: { films_rated: MOVIES.length, weights_at_time: currentUser?.weights ? { ...currentUser.weights } : null },
  });
  if (!persisted) track('book_shelf_persist_failed', { fingerprint: fp });

  track('book_shelf_curated', {
    safe_n: safe.length, upside_n: upside.length,
    overlap: safe.filter(s => upside.some(u => u.bookKey === s.bookKey)).length,
    persisted: !!persisted,
  });

  return { safe, upside, curatedAt };
}
