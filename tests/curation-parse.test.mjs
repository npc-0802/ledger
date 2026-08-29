// Unit tests for the metered-curation response parser + normalizer.
// Run: node tests/curation-parse.test.mjs

import { parseCurationJSON, normalizeCuration } from '../src/modules/books/curation-parse.js';

let passed = 0, failed = 0;
const assert = (cond, label) => { if (cond) passed++; else { failed++; console.error(`  FAIL: ${label}`); } };

const goodObj = {
  safe_picks:   [{ book_key: 'isbn:1', rank: 1, why: 'fits',     fit_dimensions: ['hold'], confidence: 0.85 }],
  upside_picks: [{ book_key: 'ol:OL1W', rank: 1, why: 'spike',  upside_basis: 'singular',  confidence: 0.6 }],
};

// ── parseCurationJSON: must never throw, must handle common malformations ──
assert(parseCurationJSON(null) === null, 'null input → null (no throw)');
assert(parseCurationJSON('') === null, 'empty string → null');
assert(parseCurationJSON('not json at all') === null, 'pure junk → null');

assert(parseCurationJSON(JSON.stringify(goodObj))?.safe_picks?.length === 1, 'strict JSON parses');

// Wrapped in markdown code fences (common Claude pattern).
const fenced = '```json\n' + JSON.stringify(goodObj) + '\n```';
assert(parseCurationJSON(fenced)?.upside_picks?.length === 1, 'fenced ```json``` parses');

// Prose before and after the JSON.
const wrapped = `Here is the curated shelf:\n${JSON.stringify(goodObj)}\nHope this helps!`;
assert(parseCurationJSON(wrapped)?.safe_picks?.[0]?.book_key === 'isbn:1', 'prose-wrapped JSON salvaged');

// Trailing comma before } — common model slip-up.
const trailing = '{"safe_picks":[{"book_key":"isbn:1","rank":1,"why":"x","confidence":0.8,},],"upside_picks":[]}';
assert(parseCurationJSON(trailing)?.safe_picks?.length === 1, 'trailing commas repaired');

// Nested braces inside strings must NOT confuse the balanced-brace extractor.
const nested = `noise {"safe_picks":[{"book_key":"isbn:1","rank":1,"why":"has } inside","confidence":0.7}],"upside_picks":[]} trailing`;
assert(parseCurationJSON(nested)?.safe_picks?.[0]?.why?.includes('}'), 'string-internal braces handled');

// Truncated mid-object → null (nothing safe to recover).
assert(parseCurationJSON('{"safe_picks":[{"book_key":"isbn:1"') === null, 'truncated object → null');

// ── normalizeCuration: tolerant of harmless omissions ──
assert(normalizeCuration(null) === null, 'null parsed → null');
assert(normalizeCuration({}) === null, 'empty object → null (nothing usable)');

// Missing upside_picks entirely → safe still usable.
const safeOnly = normalizeCuration({ safe_picks: [{ book_key: 'isbn:1' }] });
assert(safeOnly && safeOnly.safe_picks.length === 1 && safeOnly.upside_picks.length === 0, 'safe-only payload survives');

// Missing rank → inferred from array index (1-based).
const noRank = normalizeCuration({ safe_picks: [{ book_key: 'a' }, { book_key: 'b' }], upside_picks: [] });
assert(noRank.safe_picks[0].rank === 1 && noRank.safe_picks[1].rank === 2, 'missing rank inferred from order');

// String confidence (low/medium/high) → normalized to 0..1.
const strConf = normalizeCuration({ safe_picks: [{ book_key: 'a', confidence: 'high' }, { book_key: 'b', confidence: 'low' }], upside_picks: [] });
assert(strConf.safe_picks[0].confidence === 0.85 && strConf.safe_picks[1].confidence === 0.4, 'string confidence normalized');

// Numeric 0–100 confidence → scaled to 0..1.
const numConf = normalizeCuration({ safe_picks: [{ book_key: 'a', confidence: 80 }], upside_picks: [] });
assert(Math.abs(numConf.safe_picks[0].confidence - 0.8) < 0.001, 'numeric 0-100 confidence scaled');

// Picks without book_key get dropped; usable siblings preserved.
const partial = normalizeCuration({ safe_picks: [{ rank: 1, why: 'no key' }, { book_key: 'isbn:2', why: 'ok' }], upside_picks: [] });
assert(partial.safe_picks.length === 1 && partial.safe_picks[0].book_key === 'isbn:2', 'malformed picks dropped, good ones kept');

// Alternate key names tolerated (safe/upside vs safe_picks/upside_picks; bookKey → book_key).
const altKeys = normalizeCuration({ safe: [{ bookKey: 'isbn:1' }], upside: [{ key: 'ol:1' }] });
assert(altKeys.safe_picks.length === 1 && altKeys.upside_picks.length === 1, 'alternate key spellings normalized');

// Long `why` is truncated, not rejected.
const longWhy = normalizeCuration({ safe_picks: [{ book_key: 'a', why: 'x'.repeat(500) }], upside_picks: [] });
assert(longWhy.safe_picks[0].why.length === 160, 'long why truncated to 160');

console.log(`\ncuration-parse: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
