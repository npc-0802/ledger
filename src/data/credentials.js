// ── CREDENTIALS / AWARDS (display-only) ──────────────────────────────────────
// Culturally meaningful prestige tags for films and books, shown in the UI to
// help users situate a work. DELIBERATELY isolated from taste logic: nothing
// here feeds recommendation ranking, prediction scoring, weights, or archetype.
// Awards are context, not evidence of fit.
//
// Lookup is by a stable `slug(title)::year` key (no network, no external IDs),
// so it's trivial to author and extend.
//
// Acting and directing awards belong to PEOPLE, so those entries carry a
// `person`. Compact surfaces (grid cards, search rows) show the award alone to
// stay on one line; the film modal shows the person too.
//
// Ordering is by computed strength, not authoring order — see AWARD_WEIGHT.
// A Best Director win outranks a Best Picture nomination.
//
// Curated subset, not an exhaustive database.

const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── Award vocabulary ─────────────────────────────────────────────────────────
const AWARD_WEIGHT = {
  'Best Picture': 100,
  'Best Director': 90,
  'Best Actor': 86,
  'Best Actress': 86,
  'Best Supporting Actor': 82,
  'Best Supporting Actress': 82,
  'Best Animated Feature': 80,
  'Best International Feature': 78,
};
const NOMINEE_PENALTY = 35;

// Oscar win / nomination. `person` is required for acting + directing.
const win = (award, person = null) => ({ type: 'oscar', award, person, result: 'win' });
const nom = (award, person = null) => ({ type: 'oscar', award, person, result: 'nom' });
// Festival / book prizes carry their own label and weight.
const prize = (type, label, weight) => ({ type, label, weight });

const PALME = prize('cannes', "Palme d'Or winner", 95);

// ── Films — key by the year Palate Map stores ────────────────────────────────
export const FILM_CREDENTIALS = {
  // ── Best Picture winners ──
  'the-godfather::1972': [win('Best Picture'), win('Best Actor', 'Marlon Brando'), nom('Best Director', 'Francis Ford Coppola'), nom('Best Supporting Actor', 'Al Pacino')],
  'unforgiven::1992': [win('Best Picture'), win('Best Director', 'Clint Eastwood'), win('Best Supporting Actor', 'Gene Hackman'), nom('Best Actor', 'Clint Eastwood')],
  'gladiator::2000': [win('Best Picture'), win('Best Actor', 'Russell Crowe'), nom('Best Director', 'Ridley Scott'), nom('Best Supporting Actor', 'Joaquin Phoenix')],
  'the-lord-of-the-rings-the-return-of-the-king::2003': [win('Best Picture'), win('Best Director', 'Peter Jackson')],
  'the-departed::2006': [win('Best Picture'), win('Best Director', 'Martin Scorsese'), nom('Best Supporting Actor', 'Mark Wahlberg')],
  'no-country-for-old-men::2007': [win('Best Picture'), win('Best Director', 'Joel & Ethan Coen'), win('Best Supporting Actor', 'Javier Bardem')],
  '12-years-a-slave::2013': [win('Best Picture'), win('Best Supporting Actress', "Lupita Nyong'o"), nom('Best Director', 'Steve McQueen'), nom('Best Actor', 'Chiwetel Ejiofor')],
  'birdman::2014': [win('Best Picture'), win('Best Director', 'Alejandro G. Iñárritu'), nom('Best Actor', 'Michael Keaton'), nom('Best Supporting Actor', 'Edward Norton'), nom('Best Supporting Actress', 'Emma Stone')],
  'spotlight::2015': [win('Best Picture'), nom('Best Director', 'Tom McCarthy'), nom('Best Supporting Actor', 'Mark Ruffalo'), nom('Best Supporting Actress', 'Rachel McAdams')],
  'moonlight::2016': [win('Best Picture'), win('Best Supporting Actor', 'Mahershala Ali'), nom('Best Director', 'Barry Jenkins'), nom('Best Supporting Actress', 'Naomie Harris')],
  'the-shape-of-water::2017': [win('Best Picture'), win('Best Director', 'Guillermo del Toro'), nom('Best Actress', 'Sally Hawkins'), nom('Best Supporting Actor', 'Richard Jenkins'), nom('Best Supporting Actress', 'Octavia Spencer')],
  'green-book::2018': [win('Best Picture'), win('Best Supporting Actor', 'Mahershala Ali'), nom('Best Actor', 'Viggo Mortensen')],
  'parasite::2019': [win('Best Picture'), win('Best Director', 'Bong Joon-ho'), PALME],
  'nomadland::2020': [win('Best Picture'), win('Best Director', 'Chloé Zhao'), win('Best Actress', 'Frances McDormand')],
  'coda::2021': [win('Best Picture'), win('Best Supporting Actor', 'Troy Kotsur')],
  'everything-everywhere-all-at-once::2022': [win('Best Picture'), win('Best Director', 'Daniel Kwan & Daniel Scheinert'), win('Best Actress', 'Michelle Yeoh'), win('Best Supporting Actor', 'Ke Huy Quan'), win('Best Supporting Actress', 'Jamie Lee Curtis'), nom('Best Supporting Actress', 'Stephanie Hsu')],
  // Released 2023; the catalogue stores 2024, so both keys resolve.
  'oppenheimer::2023': [win('Best Picture'), win('Best Director', 'Christopher Nolan'), win('Best Actor', 'Cillian Murphy'), win('Best Supporting Actor', 'Robert Downey Jr.'), nom('Best Supporting Actress', 'Emily Blunt')],
  'anora::2024': [win('Best Picture'), win('Best Director', 'Sean Baker'), win('Best Actress', 'Mikey Madison'), nom('Best Supporting Actor', 'Yura Borisov')],

  // ── Acting / directing wins on films that did not win Best Picture ──
  'the-goodbye-girl::1977': [win('Best Actor', 'Richard Dreyfuss'), nom('Best Actress', 'Marsha Mason')],
  'fargo::1996': [win('Best Actress', 'Frances McDormand'), nom('Best Director', 'Joel Coen'), nom('Best Supporting Actor', 'William H. Macy')],
  'there-will-be-blood::2007': [win('Best Actor', 'Daniel Day-Lewis'), nom('Best Director', 'Paul Thomas Anderson')],
  'the-dark-knight::2008': [win('Best Supporting Actor', 'Heath Ledger')],
  'inglourious-basterds::2009': [win('Best Supporting Actor', 'Christoph Waltz'), nom('Best Director', 'Quentin Tarantino')],
  'lincoln::2012': [win('Best Actor', 'Daniel Day-Lewis'), nom('Best Director', 'Steven Spielberg'), nom('Best Supporting Actor', 'Tommy Lee Jones'), nom('Best Supporting Actress', 'Sally Field')],
  'gravity::2013': [win('Best Director', 'Alfonso Cuarón'), nom('Best Actress', 'Sandra Bullock')],
  'whiplash::2014': [win('Best Supporting Actor', 'J.K. Simmons')],
  'boyhood::2014': [win('Best Supporting Actress', 'Patricia Arquette'), nom('Best Director', 'Richard Linklater'), nom('Best Supporting Actor', 'Ethan Hawke')],
  'poor-things::2023': [win('Best Actress', 'Emma Stone'), nom('Best Director', 'Yorgos Lanthimos'), nom('Best Supporting Actor', 'Mark Ruffalo')],
  'a-real-pain::2024': [win('Best Supporting Actor', 'Kieran Culkin')],

  // ── Best Picture nominees ──
  'the-shawshank-redemption::1994': [nom('Best Picture'), nom('Best Actor', 'Morgan Freeman')],
  'pulp-fiction::1994': [PALME, nom('Best Picture'), nom('Best Director', 'Quentin Tarantino'), nom('Best Actor', 'John Travolta'), nom('Best Supporting Actor', 'Samuel L. Jackson'), nom('Best Supporting Actress', 'Uma Thurman')],
  'the-truman-show::1998': [nom('Best Director', 'Peter Weir'), nom('Best Supporting Actor', 'Ed Harris')],
  'the-lord-of-the-rings-the-fellowship-of-the-ring::2001': [nom('Best Picture'), nom('Best Director', 'Peter Jackson'), nom('Best Supporting Actor', 'Ian McKellen')],
  'the-lord-of-the-rings-the-two-towers::2002': [nom('Best Picture')],
  'gangs-of-new-york::2002': [nom('Best Picture'), nom('Best Director', 'Martin Scorsese'), nom('Best Actor', 'Daniel Day-Lewis')],
  'catch-me-if-you-can::2002': [nom('Best Supporting Actor', 'Christopher Walken')],
  'inception::2010': [nom('Best Picture')],
  'district-9::2009': [nom('Best Picture')],
  'the-wolf-of-wall-street::2013': [nom('Best Picture'), nom('Best Director', 'Martin Scorsese'), nom('Best Actor', 'Leonardo DiCaprio'), nom('Best Supporting Actor', 'Jonah Hill')],
  'the-grand-budapest-hotel::2014': [nom('Best Picture'), nom('Best Director', 'Wes Anderson')],
  'mad-max-fury-road::2015': [nom('Best Picture'), nom('Best Director', 'George Miller')],
  'the-big-short::2015': [nom('Best Picture'), nom('Best Director', 'Adam McKay'), nom('Best Supporting Actor', 'Christian Bale')],
  'arrival::2016': [nom('Best Picture'), nom('Best Director', 'Denis Villeneuve')],
  'get-out::2017': [nom('Best Picture'), nom('Best Director', 'Jordan Peele'), nom('Best Actor', 'Daniel Kaluuya')],
  'dont-look-up::2021': [nom('Best Picture')],
  'dune-part-1::2021': [nom('Best Picture')],
  'the-banshees-of-inisherin::2022': [nom('Best Picture'), nom('Best Director', 'Martin McDonagh'), nom('Best Actor', 'Colin Farrell'), nom('Best Supporting Actor', 'Brendan Gleeson'), nom('Best Supporting Actress', 'Kerry Condon')],
  'elvis::2022': [nom('Best Picture'), nom('Best Actor', 'Austin Butler')],
  'dune-part-2::2024': [nom('Best Picture')],
  'conclave::2024': [nom('Best Picture'), nom('Best Actor', 'Ralph Fiennes'), nom('Best Supporting Actress', 'Isabella Rossellini')],

  // ── Acting / directing nominations elsewhere ──
  '2001-a-space-odyssey::1968': [nom('Best Director', 'Stanley Kubrick')],
  'raiders-of-the-lost-ark::1981': [nom('Best Picture'), nom('Best Director', 'Steven Spielberg')],
  'boogie-nights::1997': [nom('Best Supporting Actor', 'Burt Reynolds'), nom('Best Supporting Actress', 'Julianne Moore')],
  'the-master::2012': [nom('Best Actor', 'Joaquin Phoenix'), nom('Best Supporting Actor', 'Philip Seymour Hoffman'), nom('Best Supporting Actress', 'Amy Adams')],
  'tinker-tailor-soldier-spy::2011': [nom('Best Actor', 'Gary Oldman')],

  // ── Other categories ──
  'spirited-away::2001': [win('Best Animated Feature')],
  'ratatouille::2007': [win('Best Animated Feature')],
  'how-to-train-your-dragon::2010': [nom('Best Animated Feature')],
  'anomalisa::2015': [nom('Best Animated Feature')],
  'incendies::2010': [nom('Best International Feature')],

  // ── Festival ──
  'the-tree-of-life::2011': [PALME],
  'the-square::2017': [PALME],
  'shoplifters::2018': [PALME],
  'titane::2021': [PALME],
  'triangle-of-sadness::2022': [PALME],
  'anatomy-of-a-fall::2023': [PALME],
  'oldboy::2003': [prize('cannes', 'Cannes Grand Prix winner', 88)],
};

// The catalogue stores Oppenheimer under its 2024 entry; alias to the same list.
FILM_CREDENTIALS['oppenheimer::2024'] = FILM_CREDENTIALS['oppenheimer::2023'];

// ── Books — key by first-publish year ─────────────────────────────────────────
export const BOOK_CREDENTIALS = {
  'beloved::1987': [prize('pulitzer', 'Pulitzer Prize winner', 100)],
  'the-remains-of-the-day::1989': [prize('booker', 'Booker Prize winner', 100)],
  'gilead::2004': [prize('pulitzer', 'Pulitzer Prize winner', 100)],
  'wolf-hall::2009': [prize('booker', 'Booker Prize winner', 100)],
  'a-little-life::2015': [prize('nba', 'National Book Award finalist', 70), prize('booker', 'Booker Prize shortlist', 68)],
  'all-the-light-we-cannot-see::2014': [prize('pulitzer', 'Pulitzer Prize winner', 100)],
  'the-goldfinch::2013': [prize('pulitzer', 'Pulitzer Prize winner', 100)],
  'pachinko::2017': [prize('nba', 'National Book Award finalist', 70)],
  'the-left-hand-of-darkness::1969': [prize('sf', 'Hugo & Nebula winner', 95)],
  'piranesi::2020': [prize('womens', "Women's Prize winner", 95)],
  'cloud-atlas::2004': [prize('booker', 'Booker Prize shortlist', 68)],
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

/** Sort weight: explicit `weight` wins, else award weight minus a nominee penalty. */
function credentialWeight(c) {
  if (typeof c.weight === 'number') return c.weight;
  const base = AWARD_WEIGHT[c.award] ?? 50;
  return c.result === 'nom' ? base - NOMINEE_PENALTY : base;
}

/**
 * Display label. Compact by default ("Best Supporting Actor winner"); pass
 * withPerson for surfaces with room ("Best Supporting Actor — J.K. Simmons").
 */
export function credentialLabel(c, { withPerson = false } = {}) {
  if (!c) return '';
  if (c.label) return c.label;
  const base = `${c.award} ${c.result === 'win' ? 'winner' : 'nominee'}`;
  return withPerson && c.person ? `${c.award} ${c.result === 'win' ? '—' : 'nominee —'} ${c.person}` : base;
}

/** All credentials for an item, strongest first, or []. */
export function getCredentials(item) {
  if (!item || !item.title) return [];
  const map = mediumOf(item) === 'book' ? BOOK_CREDENTIALS : FILM_CREDENTIALS;
  const list = map[itemKey(item)] || [];
  return [...list].sort((a, b) => credentialWeight(b) - credentialWeight(a));
}

/** The single strongest credential, or null. */
export function getPrimaryCredential(item) {
  return getCredentials(item)[0] || null;
}

const MEDAL_SVG = '<svg class="cred-badge-icon" width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true"><circle cx="7" cy="5" r="3.4" stroke="currentColor" stroke-width="1.2"/><path d="M4.6 7.6 3.4 12l3.6-1.8L10.6 12 9.4 7.6" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';

const escAttr = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function chip(c, { dark = false, withPerson = false } = {}) {
  const text = credentialLabel(c, { withPerson });
  // Tooltip always names the person, even where the label stays compact.
  const tip = credentialLabel(c, { withPerson: true });
  return `<span class="cred-badge${dark ? ' cred-badge-dark' : ''}" title="${escAttr(tip)}">${MEDAL_SVG}${escAttr(text)}</span>`;
}

/**
 * The primary credential as a single chip, or '' if the work has none.
 * For dense surfaces (grid cards, table rows, search results).
 */
export function credentialChipHTML(item, { dark = false } = {}) {
  const c = getPrimaryCredential(item);
  return c ? chip(c, { dark }) : '';
}

/**
 * Credentials as chips, strongest first, for surfaces with room (detail modals).
 * Names the person on acting/directing awards.
 *
 * Wins are the strong signal and nominations are context, so nominations are
 * capped separately — otherwise a heavily-nominated film returns a wall of
 * "nominee" chips that crowds out everything else on the card.
 */
export function credentialChipsHTML(item, { dark = false, max = 5, maxNominations = 2 } = {}) {
  let noms = 0;
  const shown = [];
  for (const c of getCredentials(item)) {
    if (shown.length >= max) break;
    if (c.result === 'nom') {
      if (noms >= maxNominations) continue;
      noms++;
    }
    shown.push(c);
  }
  return shown.map(c => chip(c, { dark, withPerson: true })).join('');
}
