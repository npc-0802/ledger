// Unit tests for the English-default non-Latin script filter (book retrieval).
// Run: node tests/non-latin-filter.test.mjs

import { hasNonLatinScript } from '../src/modules/books/book-api.js';

let passed = 0, failed = 0;
const assert = (cond, label) => { if (cond) passed++; else { failed++; console.error(`  FAIL: ${label}`); } };

// Should be KEPT (these are English/Latin-script titles we want to surface)
assert(!hasNonLatinScript('The Left Hand of Darkness'), 'plain English passes');
assert(!hasNonLatinScript('Norwegian Wood'),             'English translation of Murakami passes');
assert(!hasNonLatinScript('Crime and Punishment'),       'English translation of Dostoevsky passes');
assert(!hasNonLatinScript("L'Étranger"),                  'Latin accents pass (would still want the English edition)');
assert(!hasNonLatinScript('2666'),                        'numeric-only passes');
assert(!hasNonLatinScript(''),                            'empty string is not flagged');

// Should be DROPPED (titles in non-Latin scripts the user can't read)
assert(hasNonLatinScript('Мы'),                'Cyrillic title dropped (the actual bug case)');
assert(hasNonLatinScript('Преступление и наказание'), 'Russian original dropped');
assert(hasNonLatinScript('ノルウェイの森'),     'Japanese (Katakana/Kanji) dropped');
assert(hasNonLatinScript('기생충'),             'Korean (Hangul) dropped');
assert(hasNonLatinScript('百年孤独'),           'Chinese dropped');
assert(hasNonLatinScript('مئة عام من العزلة'), 'Arabic dropped');

// Defensive
assert(!hasNonLatinScript(null), 'null is not flagged');
assert(!hasNonLatinScript(undefined), 'undefined is not flagged');

console.log(`\nnon-latin-filter: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
