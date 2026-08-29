// ── TASTE-SHAPED QUERY GENERATION (Stage A) ──────────────────────────────────
// Deterministic, inspectable mapping from a user's taste summary → a small set of
// Open Library subject queries. Taste shapes RETRIEVAL here, not just downstream
// ranking: we pull books from the regions of the corpus the profile points at,
// across four query families so the candidate pool spans safe AND upside zones.
//
// Objective of this layer: RECALL of plausible matches, not final precision.

// Category → Open Library subject strings. One dimension fans out to a few
// subjects so retrieval isn't keyed to a single narrow term.
export const CATEGORY_TO_SUBJECTS = {
  story:       ['literary fiction', 'historical fiction', 'epic'],
  craft:       ['literary fiction', 'award winning fiction', 'prose style'],
  performance: ['character study', 'coming of age', 'literary fiction'],
  world:       ['fantasy', 'science fiction', 'world building'],
  experience:  ['thriller', 'adventure', 'page turner'],
  hold:        ['psychological fiction', 'haunting', 'literary fiction'],
  ending:      ['mystery', 'twist ending', 'suspense'],
  singularity: ['experimental fiction', 'speculative fiction', 'philosophical fiction'],
};

// Favorite-energy subjects — bias the pool toward higher-ceiling, singular work.
const UPSIDE_SUBJECTS = ['cult classic', 'experimental fiction', 'speculative fiction', 'genre-bending'];

// Adjacent-but-not-random expansion, keyed off the top dimension, to widen the
// funnel without drifting into noise.
const DIVERSITY_ADJACENCY = {
  story: 'mythology', craft: 'novella', performance: 'family saga', world: 'magical realism',
  experience: 'crime', hold: 'gothic', ending: 'noir', singularity: 'metafiction',
};

// ── Mood / genre lanes ("I'm in the mood for…") ──────────────────────────────
// Selecting a mood CONSTRAINS retrieval to that lane; personalization then comes
// from the cheap reranker (taste alignment / boundaries / upside). Each lane has
// a few `core` facets (recall within the lane) plus one `upside` facet so the
// High-upside shelf still has favorite-energy candidates inside the mood.
export const BOOK_MOODS = [
  { key: 'all', label: 'All' },
  { key: 'literary', label: 'Literary' },
  { key: 'scifi', label: 'Sci-fi' },
  { key: 'fantasy', label: 'Fantasy' },
  { key: 'thriller', label: 'Thriller' },
  { key: 'mystery', label: 'Mystery' },
  { key: 'horror', label: 'Horror' },
  { key: 'romance', label: 'Romance' },
  { key: 'memoir', label: 'Memoir' },
  { key: 'historical', label: 'Historical' },
  { key: 'experimental', label: 'Experimental' },
];

// Each lane: `core` facets (always queried — lane recall), `byDim` facets keyed
// to taste dimensions (queried only when the reader's defining-positive prefs
// point there — this is what makes retrieval taste-shaped WITHIN the lane), and
// an `upside` facet for favorite-energy candidates. All terms are real-ish Open
// Library subjects and stay inside the lane.
const MOOD_SUBJECTS = {
  literary: {
    core: ['literary fiction', 'contemporary fiction'],
    byDim: { story: ['historical fiction'], craft: ['prize winning fiction'], performance: ['character study'], hold: ['psychological fiction'], world: ['family saga'], singularity: ['experimental fiction'], ending: ['domestic fiction'] },
    upside: 'experimental fiction',
  },
  scifi: {
    core: ['science fiction', 'speculative fiction'],
    byDim: { world: ['space opera'], singularity: ['philosophical fiction'], story: ['hard science fiction'], hold: ['dystopia'], experience: ['military science fiction'], craft: ['cyberpunk'], ending: ['time travel'], performance: ['social science fiction'] },
    upside: 'philosophical fiction',
  },
  fantasy: {
    core: ['fantasy', 'epic fantasy'],
    byDim: { world: ['high fantasy'], hold: ['dark fantasy'], singularity: ['magical realism'], story: ['mythology'], craft: ['literary fantasy'], performance: ['coming of age'], experience: ['adventure'] },
    upside: 'magical realism',
  },
  thriller: {
    core: ['thriller', 'suspense'],
    byDim: { experience: ['action thriller'], hold: ['psychological thriller'], ending: ['crime fiction'], story: ['espionage'], craft: ['literary thriller'], singularity: ['techno-thriller'] },
    upside: 'literary thriller',
  },
  mystery: {
    core: ['mystery', 'detective fiction'],
    byDim: { ending: ['whodunit'], story: ['crime'], hold: ['noir'], craft: ['cozy mystery'], world: ['historical mystery'], performance: ['amateur sleuth'] },
    upside: 'literary mystery',
  },
  horror: {
    core: ['horror', 'supernatural'],
    byDim: { world: ['gothic fiction'], hold: ['psychological horror'], experience: ['slasher'], singularity: ['weird fiction'], story: ['ghost stories'] },
    upside: 'weird fiction',
  },
  romance: {
    core: ['romance', 'love stories'],
    byDim: { performance: ['contemporary romance'], experience: ['romantic comedy'], ending: ['romantic suspense'], world: ['historical romance'], hold: ['romantic drama'] },
    upside: 'literary romance',
  },
  memoir: {
    core: ['memoir', 'autobiography'],
    byDim: { story: ['personal narrative'], craft: ['personal essays'], performance: ['biography'], hold: ['grief'], singularity: ['literary memoir'] },
    upside: 'literary memoir',
  },
  historical: {
    core: ['historical fiction', 'historical novel'],
    byDim: { world: ['war fiction'], story: ['biographical fiction'], performance: ['family saga'], craft: ['literary historical fiction'] },
    upside: 'literary historical fiction',
  },
  experimental: {
    core: ['experimental fiction', 'metafiction'],
    byDim: { singularity: ['postmodern fiction'], craft: ['stream of consciousness'], story: ['surrealism'], hold: ['absurdist fiction'] },
    upside: 'avant-garde fiction',
  },
};

/** Canonical lane terms for catalog-seed membership (the `core` facets). */
export function moodSubjects(mood) {
  return MOOD_SUBJECTS[mood]?.core || [];
}

// Cold-start fallback when there's no usable profile yet.
const DEFAULT_QUERIES = [
  { subject: 'literary fiction', family: 'primary' },
  { subject: 'science fiction', family: 'primary' },
  { subject: 'fantasy', family: 'primary' },
  { subject: 'mystery', family: 'secondary' },
  { subject: 'speculative fiction', family: 'upside' },
  { subject: 'contemporary fiction', family: 'diversity' },
];

/**
 * Build subject queries. With a mood (other than 'all'), retrieval is CONSTRAINED
 * to that lane (taste personalization then happens in the reranker). Without a
 * mood, queries are taste-shaped across the whole space.
 * @param {object} summary - from taste-summary.buildTasteSummary
 * @param {string} [mood='all']
 * @returns {Array<{subject: string, family: 'primary'|'secondary'|'upside'|'diversity'|'mood'}>}
 */
export function buildSubjectQueries(summary, mood = 'all') {
  if (mood && mood !== 'all' && MOOD_SUBJECTS[mood]) {
    const m = MOOD_SUBJECTS[mood];
    const seen = new Set();
    const queries = [];
    const add = (subject, family) => {
      const s = String(subject || '').toLowerCase().trim();
      if (s && !seen.has(s)) { seen.add(s); queries.push({ subject: s, family }); }
    };
    // Lane recall.
    m.core.forEach(s => add(s, 'mood'));
    // Taste-shaped WITHIN the lane: pull the lane facets that match the reader's
    // defining-positive dimensions, so two readers retrieve different pools.
    const pos = (summary?.definingPositive || []).map(d => d.cat);
    pos.slice(0, 3).forEach(cat => (m.byDim?.[cat] || []).forEach(s => add(s, 'mood-taste')));
    // Lane upside facet (favorite-energy candidates in-lane).
    if (m.upside) add(m.upside, 'upside');
    return queries.slice(0, 8);
  }

  const pos = (summary?.definingPositive || []).map(d => d.cat);
  if (!pos.length) return DEFAULT_QUERIES.slice();

  const queries = [];
  const seen = new Set();
  const add = (subject, family) => {
    const s = String(subject || '').toLowerCase().trim();
    if (s && !seen.has(s)) { seen.add(s); queries.push({ subject: s, family }); }
  };

  // 1. Primary — strongest two defining categories, two subjects each.
  pos.slice(0, 2).forEach(c => (CATEGORY_TO_SUBJECTS[c] || []).slice(0, 2).forEach(s => add(s, 'primary')));
  // 2. Secondary/tension — third defining category (or co-defining pairing).
  if (pos[2]) (CATEGORY_TO_SUBJECTS[pos[2]] || []).slice(0, 1).forEach(s => add(s, 'secondary'));
  // 3. Upside — favorite-energy subjects (skew the pool toward 90+ candidates).
  UPSIDE_SUBJECTS.slice(0, 3).forEach(s => add(s, 'upside'));
  // 4. Diversity — adjacent to the top dimension, controlled (not random).
  if (DIVERSITY_ADJACENCY[pos[0]]) add(DIVERSITY_ADJACENCY[pos[0]], 'diversity');

  // Guarantee a usable floor without going overboard.
  if (queries.length < 6) DEFAULT_QUERIES.forEach(q => add(q.subject, q.family));
  return queries.slice(0, 12);
}
