// Unit test for series-aware book pool partition (recommender hygiene).
// Run: node tests/book-series-suppress.test.mjs

import { bookSeriesInfo } from '../src/modules/series-metadata.js';

let passed = 0, failed = 0;
const assert = (cond, label) => { if (cond) passed++; else { failed++; console.error(`  FAIL: ${label}`); } };

// Inline partition equivalent to the recommender's internal helper, so this
// test verifies the *logic* without depending on book-recommender's network-
// touching imports (it would otherwise pull in Supabase, fetch, etc.).
function partitionSeriesEntries(pool) {
  const allowed = [], later = [];
  for (const b of pool) {
    const info = bookSeriesInfo(b);
    if (info?.isLaterSeriesEntry) later.push(b); else allowed.push(b);
  }
  return { allowed, later };
}

const pool = [
  { title: 'Neuromancer', author: 'William Gibson' },                                    // standalone (in fact #1) — allowed
  { title: 'Count Zero',  author: 'William Gibson', seriesIndex: 2, seriesName: 'Sprawl' }, // later → suppressed
  { title: 'The Fellowship of the Ring' },                                                  // no marker → allowed
  { title: 'The Two Towers (Book 2)' },                                                     // suppressed
  { title: 'Foundation (Book 1)' },                                                          // starter → allowed
  { title: 'Foundation and Empire (Vol. 2)' },                                                // suppressed
  { title: 'Standalone literary novel' },                                                    // allowed
];

const { allowed, later } = partitionSeriesEntries(pool);

assert(later.length === 3, `expected 3 later entries, got ${later.length}`);
assert(later.find(b => b.title === 'Count Zero'), 'Count Zero suppressed');
assert(later.find(b => b.title.includes('Two Towers')), 'Two Towers Book 2 suppressed');
assert(later.find(b => b.title.includes('Foundation and Empire')), 'Foundation and Empire suppressed');

assert(allowed.find(b => b.title === 'Neuromancer'), 'Neuromancer allowed');
assert(allowed.find(b => b.title === 'Foundation (Book 1)'), 'Foundation #1 allowed');
assert(allowed.find(b => b.title === 'The Fellowship of the Ring'), 'Fellowship (no marker) allowed');
assert(allowed.find(b => b.title === 'Standalone literary novel'), 'Standalone allowed');

// Floor fallback: if filtering would empty the pool, we'd want the recommender
// to keep showing something. The partition itself is pure — the fallback lives
// in book-recommender.js — but here we sanity-check the partition behavior on
// an all-later pool.
const allLater = pool.filter(b => bookSeriesInfo(b)?.isLaterSeriesEntry);
const ap = partitionSeriesEntries(allLater);
assert(ap.allowed.length === 0, 'all-later pool yields 0 allowed (fallback path);');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
