// Award credentials: data shape, strength ordering, and label rendering.
import { getCredentials, getPrimaryCredential, credentialLabel, credentialChipHTML, credentialChipsHTML, FILM_CREDENTIALS } from '../src/data/credentials.js';

let passed = 0, failed = 0;
const t = (name, fn) => { try { fn(); passed++; } catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); } };
const eq = (a, b, m) => { if (a !== b) throw new Error(`${m || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const ok = (v, m) => { if (!v) throw new Error(m || 'expected truthy'); };

const film = (title, year) => ({ title, year, medium: 'film' });

t('acting winners are exposed', () => {
  const c = getCredentials(film('Whiplash', 2014));
  ok(c.some(x => x.award === 'Best Supporting Actor' && x.result === 'win' && x.person === 'J.K. Simmons'));
});

t('all five requested categories exist in the data', () => {
  const wanted = ['Best Actor', 'Best Actress', 'Best Supporting Actor', 'Best Supporting Actress', 'Best Director'];
  const seen = new Set(Object.values(FILM_CREDENTIALS).flat().map(c => c.award));
  for (const w of wanted) ok(seen.has(w), `${w} missing from credential data`);
});

t('every acting/directing entry names a person', () => {
  const personRequired = ['Best Actor', 'Best Actress', 'Best Supporting Actor', 'Best Supporting Actress', 'Best Director'];
  for (const [key, list] of Object.entries(FILM_CREDENTIALS)) {
    for (const c of list) {
      if (personRequired.includes(c.award)) ok(c.person, `${key}: ${c.award} has no person`);
    }
  }
});

t('a Best Director win outranks a Best Picture nomination', () => {
  // Gravity: Cuarón won Director; the film lost Best Picture.
  eq(getPrimaryCredential(film('Gravity', 2013)).award, 'Best Director');
});

t('Best Picture winner still leads where it applies', () => {
  eq(getPrimaryCredential(film('Parasite', 2019)).award, 'Best Picture');
  eq(getPrimaryCredential(film('Parasite', 2019)).result, 'win');
});

t('primary is unchanged for a nominee-only film', () => {
  const c = getPrimaryCredential(film('The Shawshank Redemption', 1994));
  eq(c.award, 'Best Picture'); eq(c.result, 'nom');
});

t('credentials come back strongest-first', () => {
  const weights = getCredentials(film('Oppenheimer', 2023));
  ok(weights.length >= 4);
  eq(weights[0].award, 'Best Picture');
});

t('compact label omits the person, full label includes it', () => {
  const c = getCredentials(film('Whiplash', 2014))[0];
  eq(credentialLabel(c), 'Best Supporting Actor winner');
  eq(credentialLabel(c, { withPerson: true }), 'Best Supporting Actor — J.K. Simmons');
});

t('nominee label reads correctly with a person', () => {
  const c = getCredentials(film('Tinker, Tailor, Soldier, Spy', 2011))[0];
  eq(credentialLabel(c, { withPerson: true }), 'Best Actor nominee — Gary Oldman');
});

t('single chip renders one badge, chips render many', () => {
  const m = film('Everything Everywhere All At Once', 2022);
  eq((credentialChipHTML(m).match(/class="cred-badge"/g) || []).length, 1);
  ok((credentialChipsHTML(m).match(/class="cred-badge/g) || []).length >= 4);
});

t('chips always name the person in the tooltip', () => {
  ok(credentialChipHTML(film('Whiplash', 2014)).includes('title="Best Supporting Actor — J.K. Simmons"'));
});

t('catalogue key mismatches resolve', () => {
  // Catalogue stores these titles/years; both previously matched nothing.
  ok(getPrimaryCredential(film('Dune: Part 1', 2021)), 'Dune: Part 1 has no credential');
  ok(getPrimaryCredential(film('Oppenheimer', 2024)), 'Oppenheimer (2024) has no credential');
  eq(getCredentials(film('Oppenheimer', 2024)).length, getCredentials(film('Oppenheimer', 2023)).length);
});

t('books still resolve and keep their own labels', () => {
  eq(getPrimaryCredential({ title: 'Beloved', year: 1987, medium: 'book' }).label, 'Pulitzer Prize winner');
});

t('unknown works return nothing', () => {
  eq(getCredentials(film('A Film That Does Not Exist', 1999)).length, 0);
  eq(credentialChipHTML(film('A Film That Does Not Exist', 1999)), '');
});

t('labels are HTML-escaped in output', () => {
  const html = credentialChipsHTML(film('The Godfather', 1972));
  ok(!html.includes('<script'));
});


t('modal chips cap nominations so wins are not crowded out', () => {
  // Banshees: five nominations, no wins -> only the two strongest show.
  const html = credentialChipsHTML(film('The Banshees of Inisherin', 2022));
  eq((html.match(/class="cred-badge"/g) || []).length, 2);
});

t('modal chips prefer wins over nominations', () => {
  // EEAAO: five wins + one nomination -> five wins, nomination dropped.
  const html = credentialChipsHTML(film('Everything Everywhere All At Once', 2022));
  eq((html.match(/class="cred-badge"/g) || []).length, 5);
  ok(!html.includes('nominee'), 'a nomination displaced a win');
});

console.log(`credentials-awards: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
