// Unit tests for target-specific analog selection.
// Run: node tests/analog-selector.test.mjs

import {
  tokens, jaccard, toneTags, toneOverlap, cosine, scoreShape,
  repetitionPenalty, selectAnalogs, formatAnalogsForPrompt,
} from '../src/modules/analog-selector.js';

let passed = 0, failed = 0;
const assert = (cond, label) => { if (cond) passed++; else { failed++; console.error(`  FAIL: ${label}`); } };

// ── Pure helpers ──
assert(tokens('a quick brown fox jumps').length === 3, 'tokens strips stopwords + short (<4) words');
assert(jaccard(['paranoia', 'identity'], ['identity', 'cold']) === 1 / 3, 'jaccard intersection/union');
assert(toneTags('a paranoid identity-fracture about surveillance').size >= 2, 'tone lexicon picks up multiple tags');
assert(toneOverlap(toneTags('paranoid surveillance'), toneTags('paranoid cold')) > 0, 'toneOverlap counts shared tags');

// scoreShape: a film that scores 95 in world and ~70 elsewhere → world dominant.
const filmWorldHeavy = { scores: { story: 70, craft: 70, performance: 70, world: 95, experience: 70, hold: 70, ending: 70, singularity: 70 } };
const shape = scoreShape(filmWorldHeavy);
assert(shape.world === 1 && shape.story === 0, 'scoreShape elevates the standout category, flattens the rest');

// cosine of two world-emphasis vectors should be 1; against an unrelated emphasis ≈ 0.
const targetWorld = { story: 0, craft: 0, performance: 0, world: 1, experience: 0, hold: 0, ending: 0, singularity: 0 };
const targetStory = { story: 1, craft: 0, performance: 0, world: 0, experience: 0, hold: 0, ending: 0, singularity: 0 };
assert(cosine(targetWorld, shape) === 1, 'cosine: matching world emphasis → 1');
assert(cosine(targetStory, shape) === 0, 'cosine: orthogonal emphasis → 0');

assert(repetitionPenalty(null) === 0, 'repetitionPenalty: null id → 0');
assert(repetitionPenalty('unseen-id') === 0, 'repetitionPenalty: unused id → 0');

// ── selectAnalogs: the key behavioral test ──
// A target book that's "paranoid identity-fracture" should NOT pick "Primer"
// (puzzle/recursive) as its top analog over "Enemy" (paranoid/identity).
const target = {
  title: 'Test Book',
  description: 'A paranoid story of identity slippage and fractured reality, a doppelganger haunting surveillance.',
  subjects: ['identity', 'paranoia'],
  categories: ['Literary Fiction'],
};
const targetDims = { story: 0.6, craft: 0.5, performance: 0.6, world: 0.4, experience: 0.3, hold: 0.9, ending: 0.5, singularity: 0.7 };
const targetText = `${target.title} ${target.description} ${target.subjects.join(' ')} ${target.categories.join(' ')}`;

const movies = [
  // Primer: puzzle/recursive, generically strong on singularity (the old failure case)
  { title: 'Primer', tmdbId: 1, total: 82,
    scores: { story: 75, craft: 80, performance: 60, world: 60, experience: 70, hold: 78, ending: 70, singularity: 95 },
    overview: 'A recursive time-loop puzzle with intricate engineering knots.', genres: 'Science Fiction', director: 'Shane Carruth', cast: '' },
  // Enemy: paranoid/identity/doppelganger — the truly apt analog
  { title: 'Enemy', tmdbId: 2, total: 84,
    scores: { story: 78, craft: 82, performance: 80, world: 70, experience: 70, hold: 88, ending: 80, singularity: 85 },
    overview: 'A man discovers his doppelganger; paranoid identity fracture and dreamlike dread.', genres: 'Thriller, Mystery', director: 'Denis Villeneuve', cast: 'Jake Gyllenhaal' },
  // A pure plot film — wrong register
  { title: 'Mad Max Fury Road', tmdbId: 3, total: 85,
    scores: { story: 70, craft: 92, performance: 70, world: 90, experience: 90, hold: 75, ending: 70, singularity: 78 },
    overview: 'A violent visceral kinetic chase across the desert.', genres: 'Action', director: 'George Miller', cast: '' },
  // A boundary case: thematically related, admired but not loved (mid total)
  { title: 'The Double', tmdbId: 4, total: 64,
    scores: { story: 70, craft: 78, performance: 72, world: 65, experience: 60, hold: 68, ending: 64, singularity: 84 },
    overview: 'A cold cerebral take on identity and a doppelganger, paranoid surveillance.', genres: 'Drama, Mystery', director: 'Richard Ayoade', cast: '' },
];

const r = selectAnalogs({ target, medium: 'book', targetDims, targetText, movies, userWeights: { hold: 4.0, singularity: 3.5 }, recordUsage: false });
assert(r.primary?.film.title === 'Enemy', 'primary affirming = Enemy (thematic + tone match), not Primer');
// The Double is thematically apt — it must surface SOMEWHERE (secondary or cautionary),
// while the irrelevant Mad Max must NOT be picked at all.
const chosenTitles = [r.primary, r.secondary, r.cautionary].filter(Boolean).map(a => a.film.title);
assert(chosenTitles.includes('The Double'), 'The Double is picked (secondary or cautionary) — its thematic relevance is recognized');
assert(!chosenTitles.includes('Mad Max Fury Road'), 'unrelated Mad Max is NOT picked despite being well-liked');
assert(r.primary?.film.title !== r.secondary?.film.title, 'primary and secondary are distinct');
assert(r.diagnostics?.candidatesTop?.length > 0, 'diagnostics include candidate scoring trace');

// Anti-repetition: the function itself must scale up with usage + recency.
// (Whether it shifts which film wins primary depends on the gap; we test the
// formula directly so the assertion is exact.)
if (typeof localStorage === 'undefined') {
  global.localStorage = { _: {}, getItem(k) { return this._[k] || null; }, setItem(k, v) { this._[k] = String(v); } };
}
global.localStorage.setItem('palatemap_analog_use_v1', JSON.stringify({ 'heavy': { count: 8, lastAt: Date.now() } }));
const pHeavy = repetitionPenalty('heavy');
const pCold = repetitionPenalty('never-used');
assert(pHeavy > 0 && pHeavy > pCold, 'penalty grows with use count + recency');
// Older usage decays — same count but lastAt 3 days ago should produce a smaller penalty.
global.localStorage.setItem('palatemap_analog_use_v1', JSON.stringify({ 'old': { count: 8, lastAt: Date.now() - 3 * 86400000 } }));
const pOld = repetitionPenalty('old');
assert(pOld < pHeavy, 'older usage carries a smaller penalty (recency decays)');

// Formatter output is non-empty and labeled by role.
const txt = formatAnalogsForPrompt(r, 'book');
assert(/Primary fit/.test(txt) && /Boundary case/.test(txt), 'formatter labels analog roles');
assert(/ANALOGS/.test(txt), 'formatter has the analogs header');

console.log(`\nanalog-selector: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
