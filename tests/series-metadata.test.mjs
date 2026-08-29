// Unit tests for series-metadata normalization (pure, no DOM, no network).
// Run: node tests/series-metadata.test.mjs

import {
  bookSeriesInfo,
  filmSeriesInfo,
  seriesPillHTML,
  cacheFilmCollection,
  noteFilmCollection,
  __test__,
} from '../src/modules/series-metadata.js';

let passed = 0, failed = 0;
const assert = (cond, label) => { if (cond) passed++; else { failed++; console.error(`  FAIL: ${label}`); } };

// ── bookSeriesInfo ────────────────────────────────────────────────────────────

// 1. Standalone book → null
assert(bookSeriesInfo({ title: 'Beloved', author: 'Toni Morrison' }) === null,
  'standalone book returns null');

// 2. Explicit seriesIndex on catalog object
{
  const r = bookSeriesInfo({ title: 'Count Zero', seriesIndex: 2, seriesName: 'Sprawl Trilogy', seriesLength: 3 });
  assert(r && r.seriesIndex === 2, 'explicit seriesIndex parsed');
  assert(r.isLaterSeriesEntry === true, 'flagged as later entry');
  assert(r.isSeriesStarter === false, 'not a starter');
  assert(r.seriesLabel === '#2 of 3', `label = "${r.seriesLabel}"`);
  assert(r.seriesName === 'Sprawl Trilogy', 'series name preserved');
}

// 3. Open Library `series` array fallback
{
  const r = bookSeriesInfo({ title: 'Some Book', olSeries: ['Wheel of Time (book 4)'] });
  assert(r && r.seriesIndex === 4, 'OL series array → seriesIndex 4');
  assert(/Wheel of Time/i.test(r.seriesName || ''), 'OL series name extracted');
}

// 4. Title-pattern fallback — explicit "Book 2"
{
  const r = bookSeriesInfo({ title: 'The Stormlight Archive: Book 2' });
  assert(r && r.seriesIndex === 2, 'title "Book 2" → seriesIndex 2');
  assert(r.isLaterSeriesEntry === true, 'title fallback flags later entry');
}

// 5. Title-pattern — "Vol. 3"
{
  const r = bookSeriesInfo({ title: 'My Saga, Vol. 3' });
  assert(r && r.seriesIndex === 3, 'title "Vol. 3" → seriesIndex 3');
}

// 6. Title-pattern — "(Book 1)"
{
  const r = bookSeriesInfo({ title: 'Foundation (Book 1)' });
  assert(r && r.seriesIndex === 1, 'parenthetical "(Book 1)" → seriesIndex 1');
  assert(r.isSeriesStarter === true, 'flagged as starter');
}

// 7. Title-pattern — word form "Part Two"
{
  const r = bookSeriesInfo({ title: 'Title: Part Two' });
  assert(r && r.seriesIndex === 2, 'word form "Part Two" → 2');
}

// 8. Bare "II" or "2" in title MUST NOT trigger (would be fragile)
{
  const r = bookSeriesInfo({ title: 'Catch-22' });
  assert(r === null, 'bare "22" in title does not trigger');
  const r2 = bookSeriesInfo({ title: 'World War II: A History' });
  assert(r2 === null, 'bare Roman "II" in title does not trigger');
}

// 9. Google Books seriesInfo
{
  const r = bookSeriesInfo({ title: 'X', googleSeriesIndex: 2, googleSeriesName: 'Cosmere' });
  assert(r && r.seriesIndex === 2, 'Google Books seriesInfo respected');
}

// 10. Label for unknown total
{
  const r = bookSeriesInfo({ title: 'X', seriesIndex: 2 });
  assert(r.seriesLabel === 'Book 2', `book label without total = "${r.seriesLabel}"`);
}

// ── filmSeriesInfo ────────────────────────────────────────────────────────────

// Standalone film → null
assert(filmSeriesInfo({ tmdbId: 12345, title: 'Standalone' }) === null,
  'film without collection cache → null');

// Pre-cached collection
cacheFilmCollection(999, [
  { id: 100, title: 'First',  release_date: '2000-01-01' },
  { id: 200, title: 'Second', release_date: '2003-01-01' },
  { id: 300, title: 'Third',  release_date: '2007-01-01' },
], 'Test Trilogy');
noteFilmCollection(200, 999, 'Test Trilogy');

{
  const r = filmSeriesInfo({ tmdbId: 200, title: 'Second' });
  assert(r && r.seriesIndex === 2, 'film via tmdbId-collection map → index 2');
  assert(r.seriesLength === 3, 'series length captured');
  assert(r.seriesLabel === '#2 of 3', `film label = "${r.seriesLabel}"`);
  assert(r.seriesName === 'Test Trilogy', 'collection name carried');
}

{
  const r = filmSeriesInfo({ tmdbId: 100, _collectionId: 999, title: 'First' });
  assert(r && r.seriesIndex === 1 && r.isSeriesStarter, 'first film flagged starter');
}

// Explicit seriesIndex on film object short-circuits the cache
{
  const r = filmSeriesInfo({ tmdbId: 9999, seriesIndex: 4, seriesLength: 6, seriesName: 'Fast Saga' });
  assert(r && r.seriesIndex === 4 && r.seriesLength === 6, 'explicit film series fields respected');
}

// Empty collection (single film) → null
cacheFilmCollection(777, [{ id: 50, title: 'Only one' }], 'Singleton');
assert(filmSeriesInfo({ tmdbId: 50, _collectionId: 777 }) === null,
  'single-film collection treated as non-series');

// ── seriesPillHTML ────────────────────────────────────────────────────────────

assert(seriesPillHTML(null) === '', 'null info → empty pill');
assert(seriesPillHTML({ seriesLabel: 'Book 2' }).includes('Book 2'),
  'pill renders label');
assert(seriesPillHTML({ seriesLabel: 'Book 2' }, { dark: true }).includes('series-pill-dark'),
  'dark variant adds class');
assert(!seriesPillHTML({ seriesLabel: 'Book 2', seriesName: '<script>' }).includes('<script>'),
  'series name escaped in title attribute');

// ── Internal helpers ──────────────────────────────────────────────────────────
assert(__test__.indexFromTitle('Foundation Book 3') === 3, 'indexFromTitle picks 3');
assert(__test__.indexFromTitle('No marker here') === null, 'indexFromTitle null on miss');
assert(__test__.buildLabel({ seriesIndex: 1, medium: 'book' }) === 'Book 1', 'buildLabel book singular');

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
