// ── SERIES METADATA (shared, books + films) ──────────────────────────────────
// Normalizes "where does this item sit in a sequence" across mediums into one
// shape, so the recommender (suppress later entries) and the UI (series-position
// pill) can both reason about it without duplicating heuristics.
//
// Normalized shape:
//   {
//     seriesName,            // "The Sprawl Trilogy", "Lord of the Rings", or null
//     seriesIndex,           // 1, 2, 3 …
//     seriesLength,          // total parts if known, else null
//     seriesLabel,           // user-facing pill text ("#2 of 3", "#1 in series")
//     isSeriesStarter,       // seriesIndex === 1
//     isLaterSeriesEntry,    // seriesIndex > 1
//   }
//
// Returns null when we don't have a reliable signal. The recommender treats
// "no signal" as "do not suppress" — recommendation hygiene, not censorship.

const TMDB_KEY = 'f5a446a5f70a9f6a16a8ddd052c121f2';
const TMDB = 'https://api.themoviedb.org/3';

// ── Title-pattern fallback (bounded; only fires when no structured signal) ───
// These patterns are deliberately conservative: they require explicit "Book N",
// "Vol. N", "Part N", or "(#N)" markers — never a bare "II" or "2" in the title.
const TITLE_NUM_PATTERNS = [
  /\b(?:book|volume|vol\.?|part)\s+(?:#)?(\d{1,2})\b/i,
  /\((?:book|vol\.?|volume|part)\s+(\d{1,2})\)/i,
  /\(#(\d{1,2})\)/i,
  /\bno\.?\s*(\d{1,2})\b/i,
];
const TITLE_WORD_PATTERNS = [
  /\b(?:book|volume|vol\.?|part)\s+(one|two|three|four|five|six|seven|eight|nine|ten)\b/i,
];
const WORD_TO_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

function indexFromTitle(title) {
  if (!title) return null;
  const t = String(title);
  for (const re of TITLE_NUM_PATTERNS) {
    const m = t.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n >= 1 && n <= 30) return n;
    }
  }
  for (const re of TITLE_WORD_PATTERNS) {
    const m = t.match(re);
    if (m) {
      const n = WORD_TO_NUM[m[1].toLowerCase()];
      if (n) return n;
    }
  }
  return null;
}

function buildLabel({ seriesIndex, seriesLength, medium }) {
  if (!seriesIndex) return null;
  if (seriesLength && seriesLength > 1) return `#${seriesIndex} of ${seriesLength}`;
  if (medium === 'book') return `Book ${seriesIndex}`;
  if (medium === 'film') return `Film ${seriesIndex}`;
  return `#${seriesIndex} in series`;
}

function pack({ medium, seriesName, seriesIndex, seriesLength }) {
  if (!seriesIndex || !Number.isFinite(seriesIndex)) return null;
  return {
    seriesName: seriesName || null,
    seriesIndex,
    seriesLength: seriesLength || null,
    seriesLabel: buildLabel({ seriesIndex, seriesLength, medium }),
    isSeriesStarter: seriesIndex === 1,
    isLaterSeriesEntry: seriesIndex > 1,
  };
}

// ── Books ─────────────────────────────────────────────────────────────────────
// Source priority (highest to lowest):
//   1. Explicit structured fields on the book object (`seriesIndex`, etc.) —
//      can come from the curated catalog or normalized provider enrichment.
//   2. Open Library work-record `series` array (string, sometimes includes "(book 2)").
//   3. Google Books `seriesInfo.bookDisplayNumber` (numeric).
//   4. Title-pattern fallback (bounded; "Book 2", "Vol. 3", "Part Two", "(#2)").
//
// Returns null when no signal is found.
export function bookSeriesInfo(book) {
  if (!book) return null;

  // 1. Explicit structured fields
  let seriesIndex = book.seriesIndex != null ? Number(book.seriesIndex) : null;
  let seriesName = book.seriesName || book.series || null;
  let seriesLength = book.seriesLength != null ? Number(book.seriesLength) : null;

  // 2. Open Library work series (string array, OL format)
  if ((!seriesIndex || !seriesName) && Array.isArray(book.olSeries) && book.olSeries.length) {
    const raw = String(book.olSeries[0] || '');
    seriesName = seriesName || raw.replace(/[;,].*$/, '').replace(/\s*\(.*$/, '').trim() || null;
    const m = raw.match(/(?:book|vol\.?|volume|part|#)\s*(\d{1,2})/i);
    if (!seriesIndex && m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n)) seriesIndex = n;
    }
  }

  // 3. Google Books seriesInfo
  if (!seriesIndex && book.googleSeriesIndex != null) {
    const n = Number(book.googleSeriesIndex);
    if (Number.isFinite(n)) seriesIndex = n;
  }
  if (!seriesName && book.googleSeriesName) seriesName = book.googleSeriesName;

  // 4. Title pattern (bounded fallback)
  if (!seriesIndex) {
    const n = indexFromTitle(book.title);
    if (n) seriesIndex = n;
  }

  return pack({ medium: 'book', seriesName, seriesIndex, seriesLength });
}

// ── Films ────────────────────────────────────────────────────────────────────
// Source: TMDB `belongs_to_collection` + the collection's sorted parts. Stored in
// a single shared cache so different surfaces (recommender, modal, hero) all
// agree on series position for the same film without duplicate fetches.
const _filmCollectionCache = {}; // collectionId → sorted parts
const _filmCollectionByTmdbId = {}; // tmdbId → { collectionId, collectionName }

export function cacheFilmCollection(collectionId, parts, collectionName) {
  if (!collectionId || !Array.isArray(parts)) return;
  _filmCollectionCache[String(collectionId)] = {
    parts: [...parts].sort((a, b) => (a.release_date || '').localeCompare(b.release_date || '')),
    name: collectionName || null,
  };
}

export function noteFilmCollection(tmdbId, collectionId, collectionName) {
  if (!tmdbId || !collectionId) return;
  _filmCollectionByTmdbId[String(tmdbId)] = { collectionId: String(collectionId), collectionName: collectionName || null };
}

export function getFilmCollectionParts(collectionId) {
  return _filmCollectionCache[String(collectionId || '')]?.parts || null;
}

function filmInfoFromCache(tmdbId, fallbackCollectionId) {
  const id = fallbackCollectionId || _filmCollectionByTmdbId[String(tmdbId)]?.collectionId;
  if (!id) return null;
  const entry = _filmCollectionCache[String(id)];
  if (!entry || !entry.parts || entry.parts.length < 2) return null;
  const idx = entry.parts.findIndex(p => String(p.id) === String(tmdbId));
  if (idx < 0) return null;
  return pack({
    medium: 'film',
    seriesName: entry.name || _filmCollectionByTmdbId[String(tmdbId)]?.collectionName || null,
    seriesIndex: idx + 1,
    seriesLength: entry.parts.length,
  });
}

/**
 * Synchronous lookup: returns series info if we've already cached the film's
 * collection from a prior fetch (e.g. recommender candidate enrichment), else null.
 * Useful for first-paint rendering without blocking on the network.
 */
export function filmSeriesInfo(film) {
  if (!film) return null;
  // Explicit structured fields take precedence (catalog, prior runs, etc.)
  if (film.seriesIndex) {
    return pack({
      medium: 'film',
      seriesName: film.collectionName || film.seriesName || null,
      seriesIndex: Number(film.seriesIndex),
      seriesLength: film.seriesLength ? Number(film.seriesLength) : null,
    });
  }
  return filmInfoFromCache(film.tmdbId, film._collectionId);
}

/**
 * Network-backed resolver: fetches TMDB detail + collection if we haven't cached
 * them yet, then returns the series info. Safe to call on modal-open; falls back
 * to null on any provider error.
 */
export async function resolveFilmSeriesInfo(film) {
  if (!film?.tmdbId) return filmSeriesInfo(film);
  const cached = filmSeriesInfo(film);
  if (cached) return cached;

  // Discover the collection id if we don't have it
  let collectionId = film._collectionId || _filmCollectionByTmdbId[String(film.tmdbId)]?.collectionId || null;
  let collectionName = null;
  if (!collectionId) {
    try {
      const res = await fetch(`${TMDB}/movie/${film.tmdbId}?api_key=${TMDB_KEY}`);
      if (!res.ok) return null;
      const detail = await res.json();
      const c = detail?.belongs_to_collection;
      if (!c?.id) return null;
      collectionId = c.id;
      collectionName = c.name || null;
      noteFilmCollection(film.tmdbId, collectionId, collectionName);
    } catch { return null; }
  }
  // Fetch the collection parts if we don't have them
  if (!_filmCollectionCache[String(collectionId)]) {
    try {
      const res = await fetch(`${TMDB}/collection/${collectionId}?api_key=${TMDB_KEY}`);
      if (!res.ok) return null;
      const data = await res.json();
      cacheFilmCollection(collectionId, data.parts || [], data.name || collectionName);
    } catch { return null; }
  }
  return filmInfoFromCache(film.tmdbId, collectionId);
}

// ── Pill rendering ────────────────────────────────────────────────────────────
const SERIES_ICON = '<svg class="series-pill-icon" width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true"><rect x="2" y="3" width="2.5" height="8" rx="0.4" stroke="currentColor" stroke-width="1.1"/><rect x="6" y="3" width="2.5" height="8" rx="0.4" stroke="currentColor" stroke-width="1.1"/><rect x="10" y="3" width="2.5" height="8" rx="0.4" stroke="currentColor" stroke-width="1.1"/></svg>';

const escAttr = s => String(s ?? '').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * Render the series-position pill. Sibling visual weight to credential chips —
 * compact, clearly secondary. Hover title shows series name when known.
 */
export function seriesPillHTML(info, { dark = false } = {}) {
  if (!info || !info.seriesLabel) return '';
  const title = info.seriesName ? `Part of ${info.seriesName}` : 'Series position';
  return `<span class="series-pill${dark ? ' series-pill-dark' : ''}" title="${escAttr(title)}">${SERIES_ICON}${escAttr(info.seriesLabel)}</span>`;
}

// ── Test seam ────────────────────────────────────────────────────────────────
// Exported for unit tests; not used by app code.
export const __test__ = { indexFromTitle, buildLabel };
