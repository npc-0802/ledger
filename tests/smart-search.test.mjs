// Unit tests for smart search query parsing and disambiguation scoring.
// Tests the pure logic without making actual TMDB API calls.

import { parseSearchQuery, computeDisambiguationScore } from '../src/modules/smart-search.js';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${label}`);
  }
}

function section(name) {
  console.log(`\n── ${name} ──`);
}

// ── Query parsing ──

section('parseSearchQuery');

{
  const r = parseSearchQuery('Stalker 1979');
  assert(r.year === 1979, 'extracts year 1979');
  assert(r.textWithoutYear === 'Stalker', 'removes year from text');
  assert(r.tokens.length === 1, 'one token remaining');
  assert(r.tokens[0] === 'Stalker', 'token is Stalker');
}

{
  const r = parseSearchQuery('Stalker Tarkovsky');
  assert(r.year === null, 'no year in "Stalker Tarkovsky"');
  assert(r.tokens.length === 2, 'two tokens');
  assert(r.tokens[0] === 'Stalker', 'first token');
  assert(r.tokens[1] === 'Tarkovsky', 'second token');
}

{
  const r = parseSearchQuery('Stalker tarkovsky 1979');
  assert(r.year === 1979, 'extracts year from complex query');
  assert(r.textWithoutYear === 'Stalker tarkovsky', 'text without year');
  assert(r.tokens.length === 2, 'two tokens after year removal');
}

{
  const r = parseSearchQuery('The Thing 1982');
  assert(r.year === 1982, 'extracts 1982');
  assert(r.textWithoutYear === 'The Thing', 'title without year');
}

{
  const r = parseSearchQuery('Nosferatu');
  assert(r.year === null, 'no year');
  assert(r.tokens.length === 1, 'one token');
}

{
  const r = parseSearchQuery('2001');
  assert(r.year === 2001, 'standalone year');
  assert(r.textWithoutYear === '', 'no text left');
}

// ── Disambiguation scoring ──

section('computeDisambiguationScore');

// Helper to make a mock TMDB result
function mockResult(title, releaseDate, directors = [], cast = []) {
  return {
    title,
    original_title: title,
    release_date: releaseDate,
    popularity: 50,
    _directors: directors,
    _writers: [],
    _cast: cast,
  };
}

// Test: "Stalker Tarkovsky" should rank 1979 Tarkovsky film above 2014 film
{
  const parsed = parseSearchQuery('Stalker Tarkovsky');
  const stalker1979 = mockResult('Stalker', '1979-05-25', ['Andrei Tarkovsky'], ['Aleksandr Kaidanovsky']);
  const stalker2014 = mockResult('Stalker', '2014-10-24', ['Steven C. Miller'], ['Milo Ventimiglia']);

  const score1979 = computeDisambiguationScore(stalker1979, parsed);
  const score2014 = computeDisambiguationScore(stalker2014, parsed);

  assert(score1979 > score2014, `"Stalker Tarkovsky" → 1979 (${score1979.toFixed(1)}) > 2014 (${score2014.toFixed(1)})`);
}

// Test: "Stalker 1979" should boost the 1979 film via year match
{
  const parsed = parseSearchQuery('Stalker 1979');
  const stalker1979 = mockResult('Stalker', '1979-05-25', ['Andrei Tarkovsky']);
  const stalker2014 = mockResult('Stalker', '2014-10-24', ['Steven C. Miller']);

  const score1979 = computeDisambiguationScore(stalker1979, parsed);
  const score2014 = computeDisambiguationScore(stalker2014, parsed);

  assert(score1979 > score2014, `"Stalker 1979" → 1979 (${score1979.toFixed(1)}) > 2014 (${score2014.toFixed(1)})`);
  assert(score1979 - score2014 >= 20, `year match provides strong boost (delta: ${(score1979 - score2014).toFixed(1)})`);
}

// Test: "The Thing Carpenter" should rank Carpenter's film above 2011 prequel
{
  const parsed = parseSearchQuery('The Thing Carpenter');
  const thing1982 = mockResult('The Thing', '1982-06-25', ['John Carpenter'], ['Kurt Russell']);
  const thing2011 = mockResult('The Thing', '2011-10-14', ['Matthijs van Heijningen Jr.'], ['Mary Elizabeth Winstead']);

  const score1982 = computeDisambiguationScore(thing1982, parsed);
  const score2011 = computeDisambiguationScore(thing2011, parsed);

  assert(score1982 > score2011, `"The Thing Carpenter" → 1982 (${score1982.toFixed(1)}) > 2011 (${score2011.toFixed(1)})`);
}

// Test: "The Thing 1982" — year disambiguation
{
  const parsed = parseSearchQuery('The Thing 1982');
  const thing1982 = mockResult('The Thing', '1982-06-25', ['John Carpenter']);
  const thing2011 = mockResult('The Thing', '2011-10-14', ['Matthijs van Heijningen Jr.']);

  const score1982 = computeDisambiguationScore(thing1982, parsed);
  const score2011 = computeDisambiguationScore(thing2011, parsed);

  assert(score1982 > score2011, `"The Thing 1982" → 1982 (${score1982.toFixed(1)}) > 2011 (${score2011.toFixed(1)})`);
}

// Test: "Suspiria Swinton" — cast disambiguation
{
  const parsed = parseSearchQuery('Suspiria Swinton');
  const suspiria2018 = mockResult('Suspiria', '2018-11-02', ['Luca Guadagnino'], ['Dakota Johnson', 'Tilda Swinton']);
  const suspiria1977 = mockResult('Suspiria', '1977-02-01', ['Dario Argento'], ['Jessica Harper']);

  const score2018 = computeDisambiguationScore(suspiria2018, parsed);
  const score1977 = computeDisambiguationScore(suspiria1977, parsed);

  assert(score2018 > score1977, `"Suspiria Swinton" → 2018 (${score2018.toFixed(1)}) > 1977 (${score1977.toFixed(1)})`);
}

// Test: "Suspiria 1977" — year overrides cast
{
  const parsed = parseSearchQuery('Suspiria 1977');
  const suspiria1977 = mockResult('Suspiria', '1977-02-01', ['Dario Argento']);
  const suspiria2018 = mockResult('Suspiria', '2018-11-02', ['Luca Guadagnino']);

  const score1977 = computeDisambiguationScore(suspiria1977, parsed);
  const score2018 = computeDisambiguationScore(suspiria2018, parsed);

  assert(score1977 > score2018, `"Suspiria 1977" → 1977 (${score1977.toFixed(1)}) > 2018 (${score2018.toFixed(1)})`);
}

// Test: "Batman Nolan" — director disambiguation among many Batman films
{
  const parsed = parseSearchQuery('Batman Nolan');
  const batman1989 = mockResult('Batman', '1989-06-23', ['Tim Burton'], ['Michael Keaton']);
  const batmanBegins = mockResult('Batman Begins', '2005-06-15', ['Christopher Nolan'], ['Christian Bale']);

  const score89 = computeDisambiguationScore(batman1989, parsed);
  const scoreBB = computeDisambiguationScore(batmanBegins, parsed);

  // Both have "batman" in title, but only Begins has Nolan as director.
  // Batman 1989 gets slightly better title score (exact word match on shorter title),
  // but Begins gets director bonus. Begins should win.
  assert(scoreBB > score89, `"Batman Nolan" → Begins (${scoreBB.toFixed(1)}) > 1989 (${score89.toFixed(1)})`);
}

// Test: "Gladiator 2000" — year helps disambiguate from sequel
{
  const parsed = parseSearchQuery('Gladiator 2000');
  const glad2000 = mockResult('Gladiator', '2000-05-05', ['Ridley Scott']);
  const glad2024 = mockResult('Gladiator II', '2024-11-22', ['Ridley Scott']);

  const score2000 = computeDisambiguationScore(glad2000, parsed);
  const score2024 = computeDisambiguationScore(glad2024, parsed);

  assert(score2000 > score2024, `"Gladiator 2000" → 2000 (${score2000.toFixed(1)}) > sequel (${score2024.toFixed(1)})`);
}

// Test: "Michael Clayton Clooney" — cast matching
{
  const parsed = parseSearchQuery('Michael Clayton Clooney');
  const mc = mockResult('Michael Clayton', '2007-10-05', ['Tony Gilroy'], ['George Clooney', 'Tilda Swinton']);
  const other = mockResult('Michael Clayton', '2007-10-05', ['Tony Gilroy'], ['Some Other Person']);

  const scoreMC = computeDisambiguationScore(mc, parsed);
  const scoreOther = computeDisambiguationScore(other, parsed);

  assert(scoreMC > scoreOther, `"Michael Clayton Clooney" → with Clooney (${scoreMC.toFixed(1)}) > without (${scoreOther.toFixed(1)})`);
}

// Test: plain title search — exact title match gets highest score regardless
{
  const parsed = parseSearchQuery('Stalker');
  const stalker1979 = mockResult('Stalker', '1979-05-25', ['Andrei Tarkovsky']);
  const stalker2014 = mockResult('Stalker', '2014-10-24', ['Steven C. Miller']);
  stalker1979.popularity = 30;
  stalker2014.popularity = 80;

  const score1979 = computeDisambiguationScore(stalker1979, parsed);
  const score2014 = computeDisambiguationScore(stalker2014, parsed);

  // Both should score similarly on title — popularity breaks tie slightly
  const diff = Math.abs(score1979 - score2014);
  assert(diff < 5, `plain "Stalker" → similar scores (diff: ${diff.toFixed(1)}) — title dominates`);
}

// Test: title-first behavior — unrelated film matching director shouldn't beat title match
{
  const parsed = parseSearchQuery('Stalker Tarkovsky');
  const stalker = mockResult('Stalker', '1979-05-25', ['Andrei Tarkovsky']);
  const mirror = mockResult('Mirror', '1975-03-07', ['Andrei Tarkovsky']); // title doesn't match

  const scoreStalker = computeDisambiguationScore(stalker, parsed);
  const scoreMirror = computeDisambiguationScore(mirror, parsed);

  assert(scoreStalker > scoreMirror, `title match + director beats director-only match (${scoreStalker.toFixed(1)} > ${scoreMirror.toFixed(1)})`);
}

// Test: "Crash 2004" vs "Crash 1996"
{
  const parsed = parseSearchQuery('Crash 2004');
  const crash2004 = mockResult('Crash', '2004-09-10', ['Paul Haggis']);
  const crash1996 = mockResult('Crash', '1996-03-22', ['David Cronenberg']);

  const score2004 = computeDisambiguationScore(crash2004, parsed);
  const score1996 = computeDisambiguationScore(crash1996, parsed);

  assert(score2004 > score1996, `"Crash 2004" → 2004 (${score2004.toFixed(1)}) > 1996 (${score1996.toFixed(1)})`);
}

// ── Summary ──
console.log(`\n══════════════════════════════`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED');
}
