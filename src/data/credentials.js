// ── CREDENTIALS / AWARDS (display-only) ──────────────────────────────────────
// Culturally meaningful prestige tags for films and books, shown in the UI to
// help users situate a work. DELIBERATELY isolated from taste logic: nothing
// here feeds recommendation ranking, prediction scoring, weights, or archetype.
// Awards are context, not evidence of fit.
//
// Lookup is by a stable `slug(title)::year` key (no network, no external IDs),
// so it's trivial to author and extend. Entries are ordered strongest-first;
// surfaces show the primary (first) credential by default to avoid award walls.
//
// Phase 1 is a curated subset, not an exhaustive database.

const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── Films — key by release year (how Palate Map stores `year`) ────────────────
export const FILM_CREDENTIALS = {
  // Best Picture winners
  'the-godfather::1972': [{ type: 'oscar', label: 'Best Picture winner' }],
  '12-years-a-slave::2013': [{ type: 'oscar', label: 'Best Picture winner' }],
  'birdman::2014': [{ type: 'oscar', label: 'Best Picture winner' }],
  'spotlight::2015': [{ type: 'oscar', label: 'Best Picture winner' }],
  'moonlight::2016': [{ type: 'oscar', label: 'Best Picture winner' }],
  'the-shape-of-water::2017': [{ type: 'oscar', label: 'Best Picture winner' }],
  'green-book::2018': [{ type: 'oscar', label: 'Best Picture winner' }],
  'parasite::2019': [{ type: 'oscar', label: 'Best Picture winner' }, { type: 'cannes', label: "Palme d'Or winner" }],
  'nomadland::2020': [{ type: 'oscar', label: 'Best Picture winner' }],
  'coda::2021': [{ type: 'oscar', label: 'Best Picture winner' }],
  'everything-everywhere-all-at-once::2022': [{ type: 'oscar', label: 'Best Picture winner' }],
  'oppenheimer::2023': [{ type: 'oscar', label: 'Best Picture winner' }],

  // Best Picture nominees
  'the-shawshank-redemption::1994': [{ type: 'oscar', label: 'Best Picture nominee' }],
  'inception::2010': [{ type: 'oscar', label: 'Best Picture nominee' }],
  'whiplash::2014': [{ type: 'oscar', label: 'Best Picture nominee' }],
  'mad-max-fury-road::2015': [{ type: 'oscar', label: 'Best Picture nominee' }],
  'get-out::2017': [{ type: 'oscar', label: 'Best Picture nominee' }],
  'dune::2021': [{ type: 'oscar', label: 'Best Picture nominee' }],

  // Palme d'Or winners (Cannes)
  'pulp-fiction::1994': [{ type: 'cannes', label: "Palme d'Or winner" }, { type: 'oscar', label: 'Best Picture nominee' }],
  'the-tree-of-life::2011': [{ type: 'cannes', label: "Palme d'Or winner" }],
  'the-square::2017': [{ type: 'cannes', label: "Palme d'Or winner" }],
  'shoplifters::2018': [{ type: 'cannes', label: "Palme d'Or winner" }],
  'titane::2021': [{ type: 'cannes', label: "Palme d'Or winner" }],
  'triangle-of-sadness::2022': [{ type: 'cannes', label: "Palme d'Or winner" }],
  'anatomy-of-a-fall::2023': [{ type: 'cannes', label: "Palme d'Or winner" }],
};

// ── Books — key by first-publish year ─────────────────────────────────────────
export const BOOK_CREDENTIALS = {
  'beloved::1987': [{ type: 'pulitzer', label: 'Pulitzer Prize winner' }],
  'the-remains-of-the-day::1989': [{ type: 'booker', label: 'Booker Prize winner' }],
  'gilead::2004': [{ type: 'pulitzer', label: 'Pulitzer Prize winner' }],
  'wolf-hall::2009': [{ type: 'booker', label: 'Booker Prize winner' }],
  'a-little-life::2015': [{ type: 'nba', label: 'National Book Award finalist' }, { type: 'booker', label: 'Booker Prize shortlist' }],
  'all-the-light-we-cannot-see::2014': [{ type: 'pulitzer', label: 'Pulitzer Prize winner' }],
  'the-goldfinch::2013': [{ type: 'pulitzer', label: 'Pulitzer Prize winner' }],
  'pachinko::2017': [{ type: 'nba', label: 'National Book Award finalist' }],
  'the-left-hand-of-darkness::1969': [{ type: 'sf', label: 'Hugo & Nebula winner' }],
  'piranesi::2020': [{ type: 'womens', label: "Women's Prize winner" }],
  'cloud-atlas::2004': [{ type: 'booker', label: 'Booker Prize shortlist' }],
};

const itemKey = (item) => {
  const year = item.year || item._yearNum ||
    (item.release_date ? String(item.release_date).slice(0, 4) : '') ||
    (item.first_publish_year || '');
  return `${slug(item.title)}::${year}`;
};

function mediumOf(item) {
  if (item.medium) return item.medium;
  if (item.isbn || item.bookKey || item.openLibraryId || (item.author && !item.tmdbId)) return 'book';
  return 'film';
}

/** All credentials for an item (strongest first), or []. */
export function getCredentials(item) {
  if (!item || !item.title) return [];
  const map = mediumOf(item) === 'book' ? BOOK_CREDENTIALS : FILM_CREDENTIALS;
  return map[itemKey(item)] || [];
}

/** The single strongest credential, or null. */
export function getPrimaryCredential(item) {
  return getCredentials(item)[0] || null;
}

const MEDAL_SVG = '<svg class="cred-badge-icon" width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="7" cy="5" r="3.4" stroke="currentColor" stroke-width="1.2"/><path d="M4.6 7.6 3.4 12l3.6-1.8L10.6 12 9.4 7.6" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';

/**
 * Render the primary credential as a chip, or '' if the work has none.
 * @param {object} item - film/book object (needs title + year)
 * @param {{ dark?: boolean }} opts - dark variant for dark headers
 */
export function credentialChipHTML(item, { dark = false } = {}) {
  const c = getPrimaryCredential(item);
  if (!c) return '';
  return `<span class="cred-badge${dark ? ' cred-badge-dark' : ''}" title="${c.label}">${MEDAL_SVG}${c.label}</span>`;
}
