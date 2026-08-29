// Unit tests for the structured taste-summary helpers (pure logic, no DOM).
// Run: node tests/taste-summary.test.mjs

import { buildTasteSummary, selectExamplesByCategories, formatTasteSummary } from '../src/modules/taste-summary.js';

let passed = 0, failed = 0;
function assert(cond, label) {
  if (cond) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

// A small, deliberately shaped dataset: this reader rewards Story + Hold,
// is cool on World, and has a clear "high World but not loved" boundary case.
const movies = [
  { title: 'Loved A',    total: 90, scores: { story: 92, craft: 80, performance: 78, world: 55, experience: 88, hold: 90, ending: 84, singularity: 80 } },
  { title: 'Loved B',    total: 86, scores: { story: 88, craft: 75, performance: 80, world: 50, experience: 85, hold: 88, ending: 80, singularity: 78 } },
  { title: 'Mid C',      total: 72, scores: { story: 70, craft: 72, performance: 70, world: 68, experience: 70, hold: 66, ending: 70, singularity: 65 } },
  { title: 'WorldShowcase', total: 60, scores: { story: 55, craft: 90, performance: 60, world: 95, experience: 58, hold: 50, ending: 60, singularity: 70 } },
  { title: 'Mid D',      total: 64, scores: { story: 66, craft: 64, performance: 62, world: 60, experience: 66, hold: 60, ending: 64, singularity: 58 } },
  { title: 'Rejected E', total: 40, scores: { story: 38, craft: 50, performance: 42, world: 45, experience: 40, hold: 35, ending: 42, singularity: 40 } },
  { title: 'Rejected F', total: 35, scores: { story: 30, craft: 48, performance: 40, world: 44, experience: 38, hold: 30, ending: 38, singularity: 36 } },
];
const weights = { story: 4.2, craft: 2.5, performance: 2.5, world: 1.4, experience: 3.0, hold: 4.0, ending: 2.5, singularity: 2.5 };

const summary = buildTasteSummary({ movies, weights, medium: 'film' });

assert(summary.totalRated === movies.length, 'totalRated counts all rated items');
assert(summary.definingPositive.some(d => d.cat === 'story'), 'Story surfaces as a defining-positive preference');
assert(summary.definingNegative.some(d => d.cat === 'world'), 'World surfaces as a defining-negative preference');
assert(summary.clusters.loved.length > 0 && summary.clusters.loved[0].title === 'Loved A', 'loved cluster leads with the highest-rated work');
assert(summary.clusters.rejected.some(m => m.title === 'Rejected F'), 'rejected cluster includes the lowest-rated work');
assert(Array.isArray(summary.boundaries), 'boundaries is an array');
assert(summary.boundaries.some(b => /World/.test(b)), 'a boundary names the de-emphasized World dimension');
assert(summary.tensions.length > 0, 'at least one tension/fault-line is surfaced');

// Trait-relevant example selection: a World-strong but not-loved work should be
// a cautionary (boundary) example when asking about World.
const ex = selectExamplesByCategories({ movies, categories: ['world'], n: 3 });
assert(ex.cautionary.some(m => m.title === 'WorldShowcase'), 'World-heavy-but-not-loved work is flagged as a cautionary example');
assert(ex.affirming.length > 0, 'affirming examples are returned');

// Formatting produces a usable prompt block.
const text = formatTasteSummary(summary, 'film');
assert(typeof text === 'string' && text.includes('TASTE SUMMARY'), 'formatTasteSummary returns a labelled block');
assert(!/undefined/.test(text), 'formatted summary contains no literal undefined');

// Empty/edge input must not throw.
const empty = buildTasteSummary({ movies: [], weights: null, medium: 'book' });
assert(empty.totalRated === 0 && formatTasteSummary(empty, 'book') === '', 'empty dataset yields empty summary, no throw');

console.log(`\ntaste-summary: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
