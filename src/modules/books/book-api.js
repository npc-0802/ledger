// ── BOOK METADATA / SEARCH ───────────────────────────────────────────────────
// Open Library is the primary source (free, no key, work-level identity).
// Google Books is a supplementary source used to enrich thin records with a
// page count, description, or categories.
//
// Everything normalizes into ONE internal book shape so the rest of the app
// never has to know which provider a field came from:
//
//   {
//     medium: 'book',
//     openLibraryId: 'OL27448W',     // work id, our preferred identity
//     isbn: '9780441478125',
//     title: 'The Left Hand of Darkness',
//     author: 'Ursula K. Le Guin',
//     year: 1969,
//     cover: 'https://covers.openlibrary.org/b/id/...-M.jpg',
//     description: '...',
//     pageCount: 304,
//     categories: ['Science Fiction', 'Literary Fiction'],
//     subjects: ['gender', 'ice planet', 'political intrigue'],
//   }
//
// Phase 1 keeps caching deliberately small: a single localStorage map keyed by
// the stable book key (work id, ISBN fallback), with a hard size cap.

const OPEN_LIBRARY = 'https://openlibrary.org';
const OL_COVERS = 'https://covers.openlibrary.org';
const GOOGLE_BOOKS = 'https://www.googleapis.com/books/v1/volumes';

// ── Stable identity ──────────────────────────────────────────────────────────
// Preferred: Open Library work id. Fallback: ISBN. Last resort: title+author slug.
// Used as the object_id for durable artifacts and the local cache key, so it must
// be deterministic for the same book across devices.
export function getBookKey(book) {
  if (!book) return null;
  if (book.openLibraryId) return `ol:${book.openLibraryId}`;
  if (book.isbn) return `isbn:${book.isbn}`;
  const slug = `${book.title || ''}::${book.author || ''}`
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return slug ? `t:${slug}` : null;
}

// ── Cover URL helpers ────────────────────────────────────────────────────────
export function coverFromOLId(coverId, size = 'M') {
  return coverId ? `${OL_COVERS}/b/id/${coverId}-${size}.jpg` : null;
}
export function coverFromISBN(isbn, size = 'M') {
  return isbn ? `${OL_COVERS}/b/isbn/${encodeURIComponent(isbn)}-${size}.jpg` : null;
}

// ── Local metadata cache ─────────────────────────────────────────────────────
const CACHE_KEY = 'palatemap_books_cache_v1';
const CACHE_CAP = 300;

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function writeCache(map) {
  try {
    const keys = Object.keys(map);
    // Evict oldest-by-insertion when over the cap (objects preserve insertion order)
    if (keys.length > CACHE_CAP) {
      const trimmed = {};
      keys.slice(keys.length - CACHE_CAP).forEach(k => { trimmed[k] = map[k]; });
      map = trimmed;
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch { /* storage full / unavailable — non-fatal */ }
}

export function getCachedBook(key) {
  if (!key) return null;
  return readCache()[key] || null;
}

export function cacheBook(book) {
  const key = getBookKey(book);
  if (!key) return book;
  const map = readCache();
  // Merge so an enriched record never loses fields a previous record had
  map[key] = { ...(map[key] || {}), ...book };
  writeCache(map);
  return map[key];
}

// ── Language / script gating ─────────────────────────────────────────────────
// Phase: assume the user's native language is English. We still recommend foreign
// authors and translated works — we just don't surface results whose displayed
// title is in a non-Latin script (e.g. the Russian edition of "We"). The source
// queries also ask for English (`language=eng` / `langRestrict=en`); this is the
// backstop because OL sometimes returns the work in its original-language form.
// Built from numeric ranges so this source file stays ASCII-only (avoids
// encoding gotchas in editors/diffs). Ranges: Greek+Coptic, Cyrillic (+suppl),
// Armenian, Hebrew, Arabic (+suppl), Syriac, Devanagari, Bengali, Thai,
// Hiragana+Katakana, CJK Ext-A, CJK Unified, Hangul Syllables.
const NON_LATIN_RE = (() => {
  const ranges = [
    [0x0370, 0x03FF], [0x0400, 0x052F], [0x0530, 0x058F], [0x0590, 0x05FF],
    [0x0600, 0x06FF], [0x0700, 0x074F], [0x0750, 0x077F],
    [0x0900, 0x097F], [0x0980, 0x09FF], [0x0E00, 0x0E7F],
    [0x3040, 0x30FF], [0x3400, 0x4DBF], [0x4E00, 0x9FFF], [0xAC00, 0xD7AF],
  ];
  const cls = ranges.map(([a, b]) =>
    `\\u${a.toString(16).padStart(4, '0').toUpperCase()}-\\u${b.toString(16).padStart(4, '0').toUpperCase()}`
  ).join('');
  return new RegExp(`[${cls}]`);
})();
export function hasNonLatinScript(s) {
  return typeof s === 'string' && NON_LATIN_RE.test(s);
}

// ── Normalization ────────────────────────────────────────────────────────────
function normalizeOpenLibraryDoc(doc) {
  const workId = (doc.key || '').replace('/works/', '') || null;
  const isbn = Array.isArray(doc.isbn) ? doc.isbn.find(Boolean) : (doc.isbn || null);
  const subjects = (doc.subject || []).slice(0, 24).map(s => String(s));
  return {
    medium: 'book',
    openLibraryId: workId,
    isbn: isbn || null,
    title: doc.title || '',
    author: Array.isArray(doc.author_name) ? doc.author_name[0] : (doc.author_name || ''),
    year: doc.first_publish_year || null,
    cover: coverFromOLId(doc.cover_i) || coverFromISBN(isbn) || null,
    description: '',
    pageCount: doc.number_of_pages_median || null,
    categories: [],
    subjects,
    // Quality/ceiling signals used by the reranker (present on subject search).
    ratingsAverage: doc.ratings_average ?? null,
    ratingsCount: doc.ratings_count ?? null,
    wantToRead: doc.want_to_read_count ?? null,
  };
}

function normalizeGoogleVolume(vol) {
  const info = vol?.volumeInfo || {};
  const ids = info.industryIdentifiers || [];
  const isbn13 = ids.find(i => i.type === 'ISBN_13')?.identifier;
  const isbn10 = ids.find(i => i.type === 'ISBN_10')?.identifier;
  let cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;
  if (cover) cover = cover.replace('http://', 'https://');
  // Google Books occasionally surfaces seriesInfo on volumeInfo (often only on
  // the /volumes/{id} detail endpoint, sometimes on search hits). Capture the
  // signals it does give without inventing them; the series-metadata module is
  // tolerant of both numeric strings and missing fields.
  const seriesInfo = info.seriesInfo || vol?.seriesInfo || null;
  const googleSeriesIndex = seriesInfo?.bookDisplayNumber != null
    ? parseInt(String(seriesInfo.bookDisplayNumber), 10) || null
    : null;
  const googleSeriesName = seriesInfo?.volumeSeries?.[0]?.seriesId || null;
  return {
    title: info.title || '',
    author: Array.isArray(info.authors) ? info.authors[0] : (info.authors || ''),
    year: info.publishedDate ? parseInt(String(info.publishedDate).slice(0, 4), 10) || null : null,
    cover,
    description: info.description || '',
    pageCount: info.pageCount || null,
    categories: info.categories || [],
    isbn: isbn13 || isbn10 || null,
    googleSeriesIndex,
    googleSeriesName,
  };
}

// Open Library work record. The `/search.json` endpoint doesn't return a
// description; the `/works/{id}.json` endpoint usually does, along with a `series`
// array on books that belong to one. This is the missing source that was causing
// recommended books like "Count Zero" to land in the modal with no synopsis.
async function fetchOpenLibraryWork(workId) {
  if (!workId) return null;
  try {
    const res = await fetch(`${OPEN_LIBRARY}/works/${encodeURIComponent(workId)}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    // OL `description` is either a string or { type, value } — normalize to string.
    const rawDesc = typeof data.description === 'string'
      ? data.description
      : (data.description && typeof data.description === 'object' ? data.description.value : '');
    // Strip OL footnote markers like "([source][1])" + bare URLs that tail the blurb.
    const description = (rawDesc || '')
      .replace(/\(\[source[^)]*\)/gi, '')
      .replace(/\bhttps?:\/\/\S+/g, '')
      .trim();
    return {
      description,
      olSeries: Array.isArray(data.series) ? data.series.filter(Boolean) : [],
      olSubjects: Array.isArray(data.subjects) ? data.subjects.slice(0, 24) : [],
    };
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Search books. Open Library is the source of truth for search + identity.
 * @returns {Promise<Array>} normalized book objects
 */
export async function searchBooks(query, { limit = 8 } = {}) {
  const q = (query || '').trim();
  if (q.length < 2) return [];
  const fields = 'key,title,author_name,first_publish_year,cover_i,isbn,subject,number_of_pages_median';
  const url = `${OPEN_LIBRARY}/search.json?q=${encodeURIComponent(q)}&language=eng&limit=${limit}&fields=${fields}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const docs = (data.docs || [])
      .filter(d => d.title && (d.key || '').startsWith('/works/') && !hasNonLatinScript(d.title))
      .slice(0, limit)
      .map(normalizeOpenLibraryDoc);
    // Warm the cache with lightweight search records (detail call enriches later)
    docs.forEach(cacheBook);
    return docs;
  } catch {
    return [];
  }
}

const SUBJECT_FIELDS = 'key,title,author_name,first_publish_year,cover_i,isbn,subject,number_of_pages_median,ratings_average,ratings_count,want_to_read_count';

/**
 * Retrieve a candidate pool for one Open Library subject (the retrieval stage of
 * the recommender). Returns normalized book objects. Errors are swallowed so a
 * single failing query never breaks the whole retrieval fan-out.
 * @returns {Promise<Array>}
 */
export async function searchBooksBySubject(subject, { limit = 20 } = {}) {
  const s = (subject || '').trim();
  if (!s) return [];
  const url = `${OPEN_LIBRARY}/search.json?q=${encodeURIComponent(`subject:(${s})`)}&language=eng&limit=${limit}&fields=${SUBJECT_FIELDS}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const docs = (data.docs || [])
      .filter(d => d.title && (d.key || '').startsWith('/works/') && !hasNonLatinScript(d.title))
      .slice(0, limit)
      .map(normalizeOpenLibraryDoc);
    docs.forEach(cacheBook);
    return docs;
  } catch {
    return [];
  }
}

/**
 * Fetch Google Books enrichment for a book (by ISBN if present, else title+author).
 * Returns a partial normalized object, or null on miss.
 */
async function fetchGoogleEnrichment(book) {
  const q = book.isbn
    ? `isbn:${book.isbn}`
    : `intitle:${book.title}${book.author ? `+inauthor:${book.author}` : ''}`;
  try {
    const res = await fetch(`${GOOGLE_BOOKS}?q=${encodeURIComponent(q)}&maxResults=1&langRestrict=en`);
    if (!res.ok) return null;
    const data = await res.json();
    const vol = (data.items || [])[0];
    return vol ? normalizeGoogleVolume(vol) : null;
  } catch {
    return null;
  }
}

/**
 * Resolve a canonical Open Library work id for a book that doesn't have one yet
 * (e.g. an ISBN-only catalog seed). This unifies identity across entry paths:
 * a curated recommendation and a free-text search of the same title both settle
 * on the same `ol:` key, so a prediction generated via one is reopened (free) via
 * the other. Returns null on any miss — caller keeps the ISBN fallback identity.
 */
async function resolveOpenLibraryId(book) {
  const q = book.isbn ? `isbn:${book.isbn}` : `${book.title || ''} ${book.author || ''}`.trim();
  if (!q) return null;
  try {
    const res = await fetch(`${OPEN_LIBRARY}/search.json?q=${encodeURIComponent(q)}&limit=1&fields=key`);
    if (!res.ok) return null;
    const data = await res.json();
    const k = (data.docs || [])[0]?.key || '';
    return k.startsWith('/works/') ? k.replace('/works/', '') : null;
  } catch {
    return null;
  }
}

/**
 * Return a fully-populated book record. Resolves a canonical work id (so identity
 * is stable across entry paths), reads cache, and enriches via Google Books when
 * Open Library metadata is thin (no description / pageCount / categories).
 * @param {object} book - a normalized book (from search) or a partial seed record
 */
export async function getBookDetails(book) {
  if (!book) return null;
  let merged = { medium: 'book', ...(getCachedBook(getBookKey(book)) || {}), ...book };
  const diag = { hadDescription: !!merged.description, descriptionSource: merged.description ? 'cache' : null };

  // Canonicalize identity to the Open Library work id when missing.
  if (!merged.openLibraryId) {
    const olId = await resolveOpenLibraryId(merged);
    if (olId) {
      merged.openLibraryId = olId;
      // Fold any prediction/metadata already cached under the old ISBN key into
      // the canonical work-id record so nothing is orphaned.
      merged = { ...(getCachedBook(getBookKey(merged)) || {}), ...merged };
      if (!diag.descriptionSource && merged.description) diag.descriptionSource = 'cache';
    }
  }

  // PRIMARY description source: Open Library work record. This is the missing
  // hop that was causing the synopsis to be absent for genre books like the
  // Sprawl trilogy — OL search responses don't include description, but the
  // work endpoint usually does. Also picks up the OL `series` field for
  // series-metadata.
  if (merged.openLibraryId && (!merged.description || !merged.olSeries)) {
    const ol = await fetchOpenLibraryWork(merged.openLibraryId);
    if (ol) {
      if (!merged.description && ol.description) {
        merged.description = ol.description;
        diag.descriptionSource = 'open_library_work';
      }
      if (!merged.olSeries && ol.olSeries?.length) merged.olSeries = ol.olSeries;
      if (ol.olSubjects?.length) {
        merged.subjects = [...new Set([...(merged.subjects || []), ...ol.olSubjects])].slice(0, 24);
      }
    }
  }

  // SECONDARY: Google Books enrichment when fields are still thin.
  const thin = !merged.description || !merged.pageCount || !(merged.categories?.length);
  if (thin) {
    const g = await fetchGoogleEnrichment(merged);
    if (g) {
      if (!merged.description && g.description) diag.descriptionSource = 'google_books';
      merged = {
        ...merged,
        description: merged.description || g.description || '',
        pageCount: merged.pageCount || g.pageCount || null,
        categories: merged.categories?.length ? merged.categories : (g.categories || []),
        cover: merged.cover || g.cover || null,
        isbn: merged.isbn || g.isbn || null,
        year: merged.year || g.year || null,
        googleSeriesIndex: merged.googleSeriesIndex ?? g.googleSeriesIndex ?? null,
        googleSeriesName: merged.googleSeriesName || g.googleSeriesName || null,
      };
    }
  }

  diag.finalHasDescription = !!merged.description;
  // Dev-only diagnostic: makes "why was the synopsis missing?" inspectable
  // without leaving console noise in production. Inspect `window.__bookDetailDiag`.
  if (typeof window !== 'undefined') {
    window.__bookDetailDiag = { ...diag, bookKey: getBookKey(merged), title: merged.title, at: new Date().toISOString() };
  }
  return cacheBook(merged);
}
