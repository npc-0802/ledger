// ── BOOK RECOMMENDATIONS + PREDICTION ────────────────────────────────────────
// Two layers, by design:
//   1. recommendBooksFromProfile() — FREE heuristic. Ranks the curated catalog by
//      how well each book's inferred dimension profile matches the user's existing
//      (film-derived) taste weights. No credits, no network, no Claude.
//   2. generateBookPrediction() — METERED. A fresh Claude prediction for one book,
//      using the existing server-backed credit system (source: 'book_predict') and
//      the existing durable-artifact model (content_type: 'book_prediction').
//
// Read path for a prediction: local cache → server artifact → fresh generation.
// Reopening a generated prediction is always free and works across devices.

import { currentUser, setCurrentUser, MOVIES, CATEGORIES } from '../../state.js';
import { sb, syncToSupabase, saveUserLocally, saveGeneratedArtifact, loadGeneratedArtifact } from '../supabase.js';
import { canUseSource, syncCreditsFromResponse, recordCreditUsage } from '../credit-policy.js';
import { track, pushAnalyticsEvent } from '../../analytics.js';
import { getCategoryLabel } from '../../data/category-descriptions.js';
import { BOOKS_CATALOG } from '../../data/books-catalog.js';
import { bookMatchScore, bookMatchDimensions, inferBookDimensions } from './book-tags.js';
import { getBookKey, getBookDetails, coverFromISBN } from './book-api.js';
import { buildTasteSummary, formatTasteSummary } from '../taste-summary.js';
import { selectAnalogs, formatAnalogsForPrompt } from '../analog-selector.js';

const PROXY_URL = 'https://palate-map-proxy.noahparikhcott.workers.dev';
export const BOOK_PREDICT_SOURCE = 'book_predict';

export { getBookKey };

// Predicted total uses the default category weights — identical convention to
// film predictions (see predict.js calcPredictedTotal) so the two read the same.
export function calcBookPredictedTotal(prediction) {
  let sum = 0, wsum = 0;
  CATEGORIES.forEach(cat => {
    const v = prediction?.predicted_scores?.[cat.key];
    if (v != null) { sum += v * cat.weight; wsum += cat.weight; }
  });
  return wsum > 0 ? Math.round((sum / wsum) * 100) / 100 : 0;
}

const bookLabel = k => getCategoryLabel(k, 'book');

// ── Heuristic recommendations (free) ─────────────────────────────────────────

function alreadyKnownKeys() {
  // Only exclude books the user has deliberately saved to their reading list.
  // Already-PREDICTED books stay in the grid so they can be shown as "ranked" at
  // a glance (the card marks them) rather than silently disappearing.
  const keys = new Set();
  (currentUser?.watchlist || []).forEach(w => {
    if (w.medium === 'book') {
      const k = w.bookKey || getBookKey(w);
      if (k) keys.add(k);
    }
  });
  return keys;
}

/**
 * Rank the curated catalog against the user's taste weights.
 * @returns {Array} book objects with { ...book, cover, matchScore, reason, bookKey }
 */
export function recommendBooksFromProfile({ limit = 8, includeKnown = false } = {}) {
  const weights = currentUser?.weights || null;
  const known = includeKnown ? new Set() : alreadyKnownKeys();

  const ranked = BOOKS_CATALOG
    .map(b => {
      const book = { medium: 'book', ...b, cover: coverFromISBN(b.isbn) };
      const bookKey = getBookKey(book);
      return {
        ...book,
        bookKey,
        matchScore: bookMatchScore(book, weights),
        reason: `${bookMatchDimensions(book, weights, bookLabel).join(' + ')} match`,
      };
    })
    .filter(b => !known.has(b.bookKey))
    .sort((a, b) => b.matchScore - a.matchScore);

  return ranked.slice(0, limit);
}

// ── Prediction cache (local) ─────────────────────────────────────────────────

// Robust lookup: a prediction may be stored under the canonical `ol:` key while
// the card in hand still carries the catalog `isbn:` key. Match on the direct
// key, the alternate ISBN/work-id keys, then fall back to the stored book's
// ISBN or title+author — so "already ranked" is detected regardless of path.
export function findBookPredictionEntry(book) {
  if (!book) return null;
  const map = currentUser?.bookPredictions || {};
  const direct = getBookKey(book);
  if (direct && map[direct]?.prediction) return map[direct];
  if (book.isbn && map[`isbn:${book.isbn}`]?.prediction) return map[`isbn:${book.isbn}`];
  if (book.openLibraryId && map[`ol:${book.openLibraryId}`]?.prediction) return map[`ol:${book.openLibraryId}`];

  const wantIsbn = book.isbn || null;
  const wantTA = book.title ? `${book.title.toLowerCase()}::${(book.author || '').toLowerCase()}` : null;
  for (const v of Object.values(map)) {
    if (!v?.prediction) continue;
    const b = v.book || {};
    if (wantIsbn && b.isbn && b.isbn === wantIsbn) return v;
    if (wantTA && b.title && `${b.title.toLowerCase()}::${(b.author || '').toLowerCase()}` === wantTA) return v;
  }
  return null;
}

export function getCachedBookPrediction(book) {
  return findBookPredictionEntry(book);
}

function trimBookPredictions(map, limit = 200) {
  const entries = Object.entries(map);
  if (entries.length <= limit) return map;
  entries.sort((a, b) => new Date(b[1].predictedAt) - new Date(a[1].predictedAt));
  return Object.fromEntries(entries.slice(0, limit));
}

function storeBookPrediction(book, prediction, predictedAt) {
  const key = getBookKey(book);
  if (!key) return;
  const raw = {
    ...(currentUser?.bookPredictions || {}),
    [key]: { book, prediction, predictedAt },
  };
  setCurrentUser({ ...currentUser, bookPredictions: trimBookPredictions(raw) });
  saveUserLocally();
  syncToSupabase();
}

/**
 * Resolve a stored prediction for a book: local cache, then server artifact.
 * Hydrates the local cache on a server hit so subsequent reads are instant.
 * @returns {Promise<{ book, prediction, predictedAt } | null>}
 */
export async function loadBookPrediction(book) {
  const local = getCachedBookPrediction(book);
  if (local?.prediction) return local;

  const key = getBookKey(book);
  if (!key) return null;
  try {
    const artifact = await loadGeneratedArtifact('book_prediction', key);
    if (artifact?.payload?.prediction) {
      const entry = {
        book: artifact.payload.book || book,
        prediction: artifact.payload.prediction,
        predictedAt: artifact.generated_at || null,
      };
      // Hydrate local cache (no sync needed — server is already the source)
      const raw = { ...(currentUser?.bookPredictions || {}), [key]: entry };
      setCurrentUser({ ...currentUser, bookPredictions: trimBookPredictions(raw) });
      saveUserLocally();
      return entry;
    }
  } catch { /* fall through */ }
  return null;
}

// ── Prompt construction ──────────────────────────────────────────────────────

function buildBookTasteProfile() {
  return {
    archetype: currentUser?.full_archetype_name || currentUser?.archetype || 'unknown',
    totalFilms: MOVIES.length,
  };
}

function buildBookPredictionPrompts(book, profile) {
  const system = `You are a precise taste-prediction engine. A reader's taste was learned from how they score films across eight universal dimensions (Story, Craft, Performance/Characters, World, Experience, Hold, Ending, Singularity). Predict how that same person would score a BOOK on the same eight dimensions, translating their film taste into reading taste. Reason from their whole taste pattern, not a shortlist of favorites. Respond ONLY with valid JSON.`;

  // Target-specific ANALOG selection: search the full rated set for the films
  // that most illuminate THIS book — across dimension shape, thematic + tone
  // overlap (from the book's description/subjects), and boundary signal — and
  // assign roles. This is what stops the system from defaulting to whichever
  // films happen to be strong on the same abstract dimensions every time.
  const dims = inferBookDimensions(book);
  const topDims = Object.entries(dims).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const summary = buildTasteSummary({ medium: 'book' });
  const targetText = `${book.title || ''} ${book.description || ''} ${(book.subjects || []).join(' ')} ${(book.categories || []).join(' ')}`;
  const analogs = selectAnalogs({ target: book, medium: 'book', targetDims: dims, targetText });

  // Dev diagnostics: inspect the reasoning inputs for the last prediction.
  if (typeof window !== 'undefined') {
    window.__pmReasoning = { medium: 'book', bookKey: getBookKey(book), title: book.title, targetCategories: topDims, analogs: analogs.diagnostics, tasteSummary: summary };
  }

  const subjects = (book.subjects || []).slice(0, 12).join(', ');
  const categories = (book.categories || []).join(', ');
  const user = `READER TASTE PROFILE (learned from ${profile.totalFilms} rated films; the same 8 dimensions apply to books):
Archetype: ${profile.archetype}

${formatTasteSummary(summary, 'book')}${formatAnalogsForPrompt(analogs, 'book')}

BOOK TO PREDICT:
${book.title}${book.year ? ` (${book.year})` : ''} by ${book.author || 'unknown'}
${categories ? `Categories: ${categories}` : ''}
${subjects ? `Subjects: ${subjects}` : ''}
${book.pageCount ? `Pages: ${book.pageCount}` : ''}
${book.description ? `Synopsis: ${String(book.description).slice(0, 600)}` : ''}

TASK: Predict how THIS reader would score this book on each dimension (1-100), translating their film taste into reading taste.
Reasoning: 2-3 sentences, second person, like a critic who knows this reader's whole palate.
- Reason from the full pattern above (defining preferences, boundaries, tensions).
- Use the ANALOGS as purposeful evidence — they were chosen for THIS book, not the reader's favorites in general. Lean on the PRIMARY analog if it truly illuminates; introduce the SECONDARY only when it adds a different angle; mention the BOUNDARY case only when partial/conditional fit matters. Do NOT recite every analog.
- Avoid the generic "because you liked X and Y" structure. Avoid name-dropping titles that aren't in the analog set.
- Name the tradeoff: what's likely to land vs not, any conditional or partial fit, and whether they'd admire this book or attach to it. If it sits near a fault line in their taste, say so. No generic book review.

JSON response:
{"predicted_scores":{"story":<1-100>,"craft":<1-100>,"performance":<1-100>,"world":<1-100>,"experience":<1-100>,"hold":<1-100>,"ending":<1-100>,"singularity":<1-100>},"confidence":"high|medium|low","reasoning":"<2-3 sentences, you/your>"}`;

  return { system, user };
}

// ── Fresh prediction (metered) ───────────────────────────────────────────────

/**
 * Generate a fresh book prediction via Claude. Spends 1 credit (server-enforced),
 * persists a durable artifact, and caches locally. Throws on quota/policy blocks
 * so the caller can render the out-of-credits state.
 * @returns {Promise<{ book, prediction, predictedAt }>}
 */
export async function generateBookPrediction(rawBook) {
  // Plan-level gate (budget is enforced server-side).
  const gate = canUseSource(BOOK_PREDICT_SOURCE);
  if (!gate.allowed) {
    pushAnalyticsEvent('pm_book_prediction_blocked', { prediction_source: BOOK_PREDICT_SOURCE });
    throw new Error(gate.reason || 'Book prediction is not available on your plan.');
  }

  pushAnalyticsEvent('pm_book_prediction_used', { screen_name: 'discover', prediction_source: BOOK_PREDICT_SOURCE });
  const _start = Date.now();

  // Enrich metadata so the prompt has description / page count / categories.
  const book = await getBookDetails(rawBook) || rawBook;
  const profile = buildBookTasteProfile();
  const { system, user } = buildBookPredictionPrompts(book, profile);

  track('book_prediction_requested', { book_key: getBookKey(book), title: book.title });

  const headers = { 'Content-Type': 'application/json' };
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  } catch {}

  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      system,
      messages: [{ role: 'user', content: user }],
      prediction_source: BOOK_PREDICT_SOURCE,
    }),
  });

  let data;
  const rawText = await res.text();
  try { data = JSON.parse(rawText); }
  catch { throw new Error(`Prediction proxy returned invalid response (HTTP ${res.status}).`); }

  // When the Worker piggybacks a balance, it is the authoritative ledger value
  // (the credit was already finalized server-side). We must NOT also locally
  // increment, or the unified credit counter double-counts this generation.
  const serverSynced = !!data._credits;
  if (serverSynced) syncCreditsFromResponse(data._credits);

  if (data.error === 'quota_exceeded' || data.error === 'plan_restricted' ||
      data.error === 'auth_required' || data.error === 'quota_service_error') {
    throw new Error(data.message || 'Prediction blocked by server policy.');
  }
  if (data.type === 'error' || data.error) {
    throw new Error(`Prediction API error: ${data.error?.message || data.error || 'unknown'}`);
  }
  if (!data.content?.length) throw new Error('Prediction API returned an empty response. Please try again.');

  const clean = (data.content[0].text || '').replace(/```json|```/g, '').trim();
  let prediction;
  try { prediction = JSON.parse(clean); }
  catch {
    const m = clean.match(/\{[\s\S]*"predicted_scores"[\s\S]*\}/);
    if (m) { try { prediction = JSON.parse(m[0]); } catch {} }
    if (!prediction) throw new Error('Prediction response was not valid JSON.');
  }

  const scores = prediction.predicted_scores;
  const valid = scores && CATEGORIES.some(c => typeof scores[c.key] === 'number' && scores[c.key] > 0);
  if (!valid) throw new Error('API returned missing category scores.');

  prediction._source = BOOK_PREDICT_SOURCE;
  const predictedAt = new Date().toISOString();
  const key = getBookKey(book);

  // Persistence-first: the durable artifact is the cross-device source of truth
  // for paid content, so AWAIT it (don't fire-and-forget) before settling credit.
  // The credit is already finalized server-side, so on a persist failure we keep
  // the local cache and surface a warning rather than silently dropping it.
  const persisted = await saveGeneratedArtifact({
    contentType: 'book_prediction',
    objectType: 'book',
    objectId: key,
    objectLabel: `${book.title}${book.author ? ' — ' + book.author : ''}`,
    payload: {
      book,
      prediction: {
        predicted_scores: prediction.predicted_scores,
        confidence: prediction.confidence,
        reasoning: prediction.reasoning,
      },
      predictedTotal: calcBookPredictedTotal(prediction),
    },
    summaryText: prediction.reasoning || null,
    generationSource: BOOK_PREDICT_SOURCE,
    metadata: {
      archetype_at_time: currentUser?.archetype || null,
      weights_at_time: currentUser?.weights ? { ...currentUser.weights } : null,
      films_rated: MOVIES.length,
      open_library_id: book.openLibraryId || null,
      isbn: book.isbn || null,
      author: book.author || null,
      page_count: book.pageCount || null,
    },
  });
  if (!persisted) {
    console.warn('[book-predict] durable artifact persist failed — prediction kept in local cache only.');
    track('book_prediction_persist_failed', { book_key: key });
  }

  // Local cache for instant reopen this session.
  storeBookPrediction(book, prediction, predictedAt);

  // Credit accounting is server-authoritative when the Worker piggybacked a
  // balance; only fall back to a local increment when it didn't (offline/no
  // piggyback), so we never double-count a single generation.
  if (!serverSynced) recordCreditUsage('prediction', BOOK_PREDICT_SOURCE, key);

  track('book_prediction_completed', {
    book_key: key,
    predicted_total: calcBookPredictedTotal(prediction),
    confidence: prediction.confidence || null,
    duration_ms: Date.now() - _start,
  });

  return { book, prediction, predictedAt };
}
