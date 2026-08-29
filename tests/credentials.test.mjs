// Unit tests for the credentials/awards resolver (pure, display-only).
// Run: node tests/credentials.test.mjs

import { getCredentials, getPrimaryCredential, credentialChipHTML, credentialLabel } from '../src/data/credentials.js';

let passed = 0, failed = 0;
const assert = (cond, label) => { if (cond) passed++; else { failed++; console.error(`  FAIL: ${label}`); } };

// Film — strongest-first ordering, year-keyed.
const par = getCredentials({ title: 'Parasite', year: 2019, medium: 'film' });
assert(par.length >= 2 && par[0].award === 'Best Picture' && par[0].result === 'win', 'Parasite → Best Picture winner is primary');
assert(getPrimaryCredential({ title: 'Parasite', year: 2019, medium: 'film' }).type === 'oscar', 'primary credential resolves');

// Medium inference (no explicit medium): release_date → film.
assert(credentialLabel(getPrimaryCredential({ title: 'Moonlight', release_date: '2016-10-21' })) === 'Best Picture winner', 'film inferred from release_date');

// Book — year-keyed, medium-aware.
assert(getPrimaryCredential({ title: 'Beloved', year: 1987, medium: 'book' })?.type === 'pulitzer', 'Beloved → Pulitzer');
assert(getPrimaryCredential({ title: 'The Left Hand of Darkness', year: 1969, medium: 'book' })?.label === 'Hugo & Nebula winner', 'Le Guin → Hugo & Nebula');

// Slug normalization handles punctuation/case.
assert(getCredentials({ title: 'everything everywhere ALL at once', year: 2022, medium: 'film' }).length >= 1, 'slug normalizes case/spacing');

// Same title across mediums doesn't collide (different maps).
assert(getCredentials({ title: 'Parasite', year: 2019, medium: 'book' }).length === 0, 'film key does not leak into book lookup');

// Missing → graceful empty + empty chip.
assert(getCredentials({ title: 'Some Unknown Film', year: 2001, medium: 'film' }).length === 0, 'unknown work → no credentials');
assert(credentialChipHTML({ title: 'Some Unknown Film', year: 2001, medium: 'film' }) === '', 'no credential → empty chip (no chrome)');

// Present → chip carries the label + class.
const chip = credentialChipHTML({ title: 'Parasite', year: 2019, medium: 'film' });
assert(/cred-badge/.test(chip) && /Best Picture winner/.test(chip), 'chip renders class + label');

console.log(`\ncredentials: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
