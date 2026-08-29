// ── CURATED BOOK CANDIDATE CATALOG ───────────────────────────────────────────
// Phase 1 has no shelf/tag-genome ingestion pipeline (that's a later phase), so
// heuristic recommendations rank against this hand-authored candidate pool.
//
// Each entry carries enough metadata for book-tags.js to infer an 8-dimension
// profile (categories + subjects) and for the UI to render a real card (cover via
// ISBN). Identity is the ISBN (getBookKey → `isbn:...`), which is stable across
// devices without a network round-trip. The set is intentionally spread across
// genres so dimension-matching produces variety, not one cluster.
//
// This is a seed list, not a graph — keep it coherent, not exhaustive.

export const BOOKS_CATALOG = [
  // ── Literary fiction ──
  { title: 'A Little Life', author: 'Hanya Yanagihara', year: 2015, isbn: '9780385539258',
    categories: ['Literary Fiction'], subjects: ['friendship', 'trauma', 'character study', 'new york'] },
  { title: 'Beloved', author: 'Toni Morrison', year: 1987, isbn: '9781400033416',
    categories: ['Literary Fiction', 'Historical Fiction'], subjects: ['memory', 'slavery', 'haunting', 'motherhood'] },
  { title: 'Gilead', author: 'Marilynne Robinson', year: 2004, isbn: '9780312424404',
    categories: ['Literary Fiction', 'Philosophical Fiction'], subjects: ['faith', 'fathers and sons', 'mortality', 'memory'] },
  { title: 'Normal People', author: 'Sally Rooney', year: 2018, isbn: '9781984822178',
    categories: ['Literary Fiction', 'Romance'], subjects: ['relationships', 'class', 'coming of age', 'ireland'] },
  { title: 'The Remains of the Day', author: 'Kazuo Ishiguro', year: 1989, isbn: '9780679731726',
    categories: ['Literary Fiction'], subjects: ['memory', 'regret', 'duty', 'england'] },

  // ── Science fiction ──
  { title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', year: 1969, isbn: '9780441478125',
    categories: ['Science Fiction', 'Literary Fiction'], subjects: ['gender', 'political intrigue', 'ice planet', 'first contact'] },
  { title: 'Dune', author: 'Frank Herbert', year: 1965, isbn: '9780441013593',
    categories: ['Science Fiction'], subjects: ['desert planet', 'politics', 'religion', 'world-building', 'ecology'] },
  { title: 'Project Hail Mary', author: 'Andy Weir', year: 2021, isbn: '9780593135204',
    categories: ['Science Fiction', 'Thriller'], subjects: ['space', 'problem solving', 'survival', 'first contact'] },
  { title: 'Klara and the Sun', author: 'Kazuo Ishiguro', year: 2021, isbn: '9780593318171',
    categories: ['Science Fiction', 'Literary Fiction'], subjects: ['artificial intelligence', 'love', 'mortality', 'observation'] },
  { title: 'Annihilation', author: 'Jeff VanderMeer', year: 2014, isbn: '9780374104092',
    categories: ['Science Fiction', 'Horror'], subjects: ['weird fiction', 'atmosphere', 'the unknown', 'expedition'] },

  // ── Fantasy ──
  { title: 'The Name of the Wind', author: 'Patrick Rothfuss', year: 2007, isbn: '9780756404741',
    categories: ['Fantasy'], subjects: ['magic', 'world-building', 'coming of age', 'storytelling'] },
  { title: 'The Fifth Season', author: 'N. K. Jemisin', year: 2015, isbn: '9780316229296',
    categories: ['Fantasy', 'Science Fiction'], subjects: ['world-building', 'oppression', 'geology', 'motherhood'] },
  { title: 'Piranesi', author: 'Susanna Clarke', year: 2020, isbn: '9781635575637',
    categories: ['Fantasy', 'Literary Fiction'], subjects: ['atmosphere', 'mystery', 'labyrinth', 'wonder'] },
  { title: 'The Lord of the Rings', author: 'J. R. R. Tolkien', year: 1954, isbn: '9780544003415',
    categories: ['Fantasy'], subjects: ['quest', 'world-building', 'mythology', 'good and evil'] },

  // ── Thriller / mystery ──
  { title: 'Gone Girl', author: 'Gillian Flynn', year: 2012, isbn: '9780307588371',
    categories: ['Thriller', 'Mystery'], subjects: ['marriage', 'unreliable narrator', 'twist', 'suspense'] },
  { title: 'The Silent Patient', author: 'Alex Michaelides', year: 2019, isbn: '9781250301697',
    categories: ['Thriller', 'Mystery'], subjects: ['psychology', 'twist', 'suspense', 'crime'] },
  { title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', year: 2005, isbn: '9780307454546',
    categories: ['Thriller', 'Mystery'], subjects: ['investigation', 'crime', 'suspense', 'sweden'] },
  { title: 'Tana French: In the Woods', author: 'Tana French', year: 2007, isbn: '9780143113492',
    categories: ['Mystery', 'Literary Fiction'], subjects: ['detective', 'memory', 'atmosphere', 'ireland'] },

  // ── Philosophical / speculative ──
  { title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky', year: 1880, isbn: '9780374528379',
    categories: ['Literary Fiction', 'Philosophical Fiction'], subjects: ['faith', 'morality', 'family', 'free will'] },
  { title: 'Stoner', author: 'John Williams', year: 1965, isbn: '9781590171998',
    categories: ['Literary Fiction'], subjects: ['quiet life', 'work', 'disappointment', 'character study'] },
  { title: 'The Stranger', author: 'Albert Camus', year: 1942, isbn: '9780679720201',
    categories: ['Philosophical Fiction', 'Literary Fiction'], subjects: ['absurdism', 'alienation', 'morality', 'detachment'] },
  { title: 'Never Let Me Go', author: 'Kazuo Ishiguro', year: 2005, isbn: '9781400078776',
    categories: ['Science Fiction', 'Literary Fiction', 'Philosophical Fiction'], subjects: ['mortality', 'memory', 'love', 'ethics'] },

  // ── Romance ──
  { title: 'Pride and Prejudice', author: 'Jane Austen', year: 1813, isbn: '9780141439518',
    categories: ['Romance', 'Literary Fiction'], subjects: ['marriage', 'class', 'wit', 'character study'] },
  { title: 'The Song of Achilles', author: 'Madeline Miller', year: 2011, isbn: '9780062060624',
    categories: ['Romance', 'Historical Fiction', 'Fantasy'], subjects: ['mythology', 'love', 'war', 'fate'] },
  { title: 'Beach Read', author: 'Emily Henry', year: 2020, isbn: '9781984806734',
    categories: ['Romance'], subjects: ['writers', 'grief', 'humor', 'relationships'] },

  // ── Horror ──
  { title: 'The Haunting of Hill House', author: 'Shirley Jackson', year: 1959, isbn: '9780143039983',
    categories: ['Horror', 'Literary Fiction'], subjects: ['atmosphere', 'psychology', 'haunting', 'dread'] },
  { title: 'Mexican Gothic', author: 'Silvia Moreno-Garcia', year: 2020, isbn: '9780525620785',
    categories: ['Horror'], subjects: ['atmosphere', 'gothic', 'mexico', 'dread'] },

  // ── Historical fiction ──
  { title: 'Wolf Hall', author: 'Hilary Mantel', year: 2009, isbn: '9780312429980',
    categories: ['Historical Fiction', 'Literary Fiction'], subjects: ['tudor england', 'politics', 'power', 'character study'] },
  { title: 'All the Light We Cannot See', author: 'Anthony Doerr', year: 2014, isbn: '9781476746586',
    categories: ['Historical Fiction', 'Literary Fiction'], subjects: ['world war ii', 'atmosphere', 'fate', 'craft'] },
  { title: 'Pachinko', author: 'Min Jin Lee', year: 2017, isbn: '9781455563937',
    categories: ['Historical Fiction', 'Literary Fiction'], subjects: ['family saga', 'korea', 'immigration', 'endurance'] },

  // ── Nonfiction / essay / memoir ──
  { title: 'Educated', author: 'Tara Westover', year: 2018, isbn: '9780399590504',
    categories: ['Memoir', 'Nonfiction'], subjects: ['family', 'education', 'memory', 'resilience'] },
  { title: 'Sapiens', author: 'Yuval Noah Harari', year: 2011, isbn: '9780062316110',
    categories: ['Nonfiction', 'History'], subjects: ['big ideas', 'humanity', 'argument', 'sweep'] },
  { title: 'The Year of Magical Thinking', author: 'Joan Didion', year: 2005, isbn: '9781400078431',
    categories: ['Memoir', 'Nonfiction'], subjects: ['grief', 'memory', 'prose', 'mortality'] },

  // ── Short / singular / cult ──
  { title: 'Slaughterhouse-Five', author: 'Kurt Vonnegut', year: 1969, isbn: '9780385333849',
    categories: ['Science Fiction', 'Literary Fiction'], subjects: ['war', 'time', 'absurdism', 'singular voice'] },
  { title: 'House of Leaves', author: 'Mark Z. Danielewski', year: 2000, isbn: '9780375703768',
    categories: ['Horror', 'Literary Fiction'], subjects: ['experimental', 'labyrinth', 'dread', 'singular'] },
  { title: 'Cloud Atlas', author: 'David Mitchell', year: 2004, isbn: '9780375507250',
    categories: ['Science Fiction', 'Literary Fiction'], subjects: ['structure', 'time', 'interlocking', 'ambition'] },
];
