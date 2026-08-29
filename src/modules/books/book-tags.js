// ── BOOK TAG → DIMENSION MAPPING ─────────────────────────────────────────────
// Phase 1 heuristic: translate a book's genre/category/subject tags into an
// emphasis vector across the 8 universal dimensions, so a book can be compared
// against a user's existing (film-derived) taste weights.
//
// This is intentionally hand-authored and coherent, not academically perfect.
// Each tag contributes weighted "votes" to the dimensions it tends to foreground.
// Keys are matched as case-insensitive substrings against a book's categories +
// subjects, so 'literary fiction' matches both the category and loose subjects.

const DIMS = ['story', 'craft', 'performance', 'world', 'experience', 'hold', 'ending', 'singularity'];

// tag → { dimension: weight }
export const BOOK_TAG_MAP = {
  // Genres / categories
  'literary fiction':      { story: 2, craft: 3, hold: 2, performance: 1 },
  'philosophical fiction': { story: 2, singularity: 3, ending: 2, hold: 1 },
  'fantasy':               { world: 3, hold: 2, singularity: 1, story: 1 },
  'science fiction':       { world: 2, singularity: 3, story: 2, ending: 1 },
  'thriller':              { experience: 3, hold: 2, ending: 2, story: 1 },
  'mystery':               { story: 2, ending: 3, hold: 2, experience: 1 },
  'romance':               { performance: 3, experience: 2, ending: 2 },
  'horror':                { world: 2, experience: 2, hold: 3, singularity: 1 },
  'historical fiction':    { world: 3, story: 2, craft: 1, performance: 1 },
  'memoir':                { performance: 2, craft: 2, hold: 2, story: 1 },
  'nonfiction':            { craft: 2, story: 2, singularity: 1 },
  'history':               { world: 2, story: 2, craft: 1 },

  // Subjects / texture
  'world-building':        { world: 3, singularity: 1 },
  'atmosphere':            { world: 3, hold: 1 },
  'character study':       { performance: 3, hold: 1 },
  'coming of age':         { performance: 2, story: 2 },
  'twist':                 { ending: 3, experience: 1 },
  'suspense':              { experience: 3, hold: 2 },
  'unreliable narrator':   { craft: 2, singularity: 2, ending: 1 },
  'experimental':          { singularity: 3, craft: 2 },
  'singular voice':        { singularity: 3, craft: 1 },
  'singular':              { singularity: 3 },
  'structure':             { craft: 3, singularity: 1 },
  'prose':                 { craft: 3, hold: 1 },
  'memory':                { hold: 3, story: 1 },
  'grief':                 { performance: 2, hold: 2, experience: 1 },
  'mortality':             { singularity: 1, hold: 2, ending: 2 },
  'love':                  { performance: 3, experience: 1 },
  'relationships':         { performance: 3, story: 1 },
  'family':                { performance: 2, story: 2, hold: 1 },
  'family saga':           { performance: 2, story: 2, world: 1, hold: 1 },
  'politics':              { story: 2, world: 2 },
  'political intrigue':    { story: 3, world: 1, hold: 1 },
  'war':                   { story: 2, world: 2, experience: 1 },
  'faith':                 { singularity: 2, story: 1, ending: 1 },
  'morality':              { story: 2, singularity: 2, ending: 1 },
  'absurdism':             { singularity: 3, ending: 1 },
  'dread':                 { hold: 3, world: 1 },
  'wonder':                { world: 2, singularity: 2 },
  'survival':              { experience: 2, story: 2 },
  'problem solving':       { story: 2, experience: 2 },
  'big ideas':             { singularity: 2, story: 2 },
  'ambition':              { craft: 2, singularity: 2, world: 1 },
  'fate':                  { ending: 2, story: 1, hold: 1 },
  'quiet life':            { hold: 2, performance: 2, craft: 1 },
};

function collectTags(book) {
  const raw = [
    ...(book?.categories || []),
    ...(book?.subjects || []),
  ].map(t => String(t).toLowerCase().trim()).filter(Boolean);
  return [...new Set(raw)];
}

/**
 * Infer a 0..1 emphasis vector across the 8 dimensions from a book's tags.
 * Returns a normalized object (max dimension ≈ 1). Falls back to a mild,
 * story/experience-leaning default when no tags match — never all-zero.
 */
export function inferBookDimensions(book) {
  const tally = Object.fromEntries(DIMS.map(d => [d, 0]));
  const tags = collectTags(book);
  let matched = 0;

  for (const tag of tags) {
    for (const [mapTag, weights] of Object.entries(BOOK_TAG_MAP)) {
      if (tag === mapTag || tag.includes(mapTag) || mapTag.includes(tag)) {
        for (const [dim, w] of Object.entries(weights)) tally[dim] += w;
        matched++;
        break; // one map hit per book tag is enough
      }
    }
  }

  // No signal at all → neutral-but-readable default (a generic narrative book)
  if (matched === 0) {
    return { story: 0.8, craft: 0.6, performance: 0.6, world: 0.5,
             experience: 0.7, hold: 0.5, ending: 0.5, singularity: 0.4 };
  }

  const max = Math.max(...DIMS.map(d => tally[d])) || 1;
  return Object.fromEntries(DIMS.map(d => [d, Math.round((tally[d] / max) * 100) / 100]));
}

/**
 * Match score (0..1) between a book's inferred emphasis and a user's weight
 * profile. Cosine similarity rewards books that foreground the dimensions the
 * user weights most — the same emphasis vector, regardless of magnitude.
 * @param {object} book
 * @param {object} userWeights - e.g. { story: 3.2, craft: 2.8, ... }
 */
export function bookMatchScore(book, userWeights) {
  if (!userWeights) return 0;
  const bookVec = inferBookDimensions(book);
  let dot = 0, bMag = 0, uMag = 0;
  for (const d of DIMS) {
    const b = bookVec[d] || 0;
    const u = userWeights[d] || 0;
    dot += b * u; bMag += b * b; uMag += u * u;
  }
  if (bMag === 0 || uMag === 0) return 0;
  return dot / (Math.sqrt(bMag) * Math.sqrt(uMag));
}

/**
 * Human-readable reason a book matches: the dimensions the book foregrounds that
 * the user also weights highly. Returns label strings via the provided lookup.
 * @param {object} book
 * @param {object} userWeights
 * @param {(key:string)=>string} labelFor - maps dimension key → display label
 */
export function bookMatchDimensions(book, userWeights, labelFor = k => k) {
  const bookVec = inferBookDimensions(book);
  if (!userWeights) {
    return DIMS.filter(d => bookVec[d] >= 0.7).slice(0, 2).map(labelFor);
  }
  // Rank by combined emphasis (book foregrounds it AND user cares about it)
  const ranked = DIMS
    .map(d => ({ d, score: (bookVec[d] || 0) * (userWeights[d] || 0) }))
    .sort((a, b) => b.score - a.score)
    .filter(x => x.score > 0)
    .slice(0, 2)
    .map(x => labelFor(x.d));
  return ranked.length ? ranked : ['Story'].map(labelFor);
}
