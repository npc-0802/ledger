// Unit tests for taste-shaped subject-query generation (pure, no DOM).
// Run: node tests/book-queries.test.mjs

import { buildSubjectQueries, CATEGORY_TO_SUBJECTS, BOOK_MOODS, moodSubjects } from '../src/modules/books/book-queries.js';

let passed = 0, failed = 0;
const assert = (cond, label) => { if (cond) passed++; else { failed++; console.error(`  FAIL: ${label}`); } };

// A profile that leans into world/hold/singularity, cool on experience.
const summary = {
  definingPositive: [{ cat: 'world' }, { cat: 'hold' }, { cat: 'singularity' }],
  definingNegative: [{ cat: 'experience' }],
};
const q = buildSubjectQueries(summary);

assert(q.length >= 6 && q.length <= 12, 'returns 6–12 queries');
const families = new Set(q.map(x => x.family));
assert(families.has('primary'), 'includes a primary family query');
assert(families.has('upside'), 'includes an upside family query');
const subjects = q.map(x => x.subject);
assert(new Set(subjects).size === subjects.length, 'queries are de-duplicated');
// World is the top defining-positive → its subjects should appear in retrieval
assert(CATEGORY_TO_SUBJECTS.world.some(s => subjects.includes(s)), 'world-derived subjects are retrieved');

// Cold start (no profile) still yields a usable default set.
const cold = buildSubjectQueries(null);
assert(cold.length >= 6, 'cold-start fallback returns a usable query set');
assert(cold.every(x => x.subject && x.family), 'every query has subject + family');

// ── Mood lanes ──
assert(BOOK_MOODS[0].key === 'all', 'mood list starts with All');
assert(BOOK_MOODS.some(m => m.key === 'scifi'), 'mood list includes sci-fi');

const sci = buildSubjectQueries(summary, 'scifi'); // summary leans world/hold/singularity
assert(sci.every(q => ['mood', 'mood-taste', 'upside'].includes(q.family)), 'mood queries stay in the lane');
assert(sci.some(q => q.subject.includes('science fiction')), 'sci-fi lane retrieves science fiction (recall)');
assert(sci.some(q => q.subject === 'philosophical fiction'), 'mood lane includes its upside facet');
assert(!sci.some(q => q.subject === 'fantasy'), 'sci-fi lane does not pull cross-lane subjects');
// Taste-shaped WITHIN the lane: a world/singularity reader pulls world/singular SF facets.
assert(sci.some(q => q.subject === 'space opera'), 'world-leaning reader pulls world-y sci-fi (space opera)');

// A different palate retrieves a DIFFERENT sci-fi pool (the P1 requirement).
const sciPlot = buildSubjectQueries(
  { definingPositive: [{ cat: 'story' }, { cat: 'experience' }, { cat: 'ending' }], definingNegative: [], categoryAverages: {} },
  'scifi',
);
assert(sciPlot.some(q => q.subject === 'hard science fiction'), 'plot-leaning reader pulls hard SF');
assert(!sciPlot.some(q => q.subject === 'space opera'), 'plot-leaning reader does NOT get the world reader\'s pool');
const sciSubs = new Set(sci.map(q => q.subject));
assert(sciPlot.some(q => !sciSubs.has(q.subject)), 'same mood, different palate → different retrieval pool');

// 'all' (or omitted) → taste-shaped, not lane-constrained.
const all = buildSubjectQueries(summary, 'all');
assert(all.some(q => q.family === 'primary'), "'all' uses taste-shaped families");
assert(moodSubjects('scifi').length > 0 && moodSubjects('all').length === 0, 'moodSubjects resolves lanes, empty for all');

console.log(`\nbook-queries: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
