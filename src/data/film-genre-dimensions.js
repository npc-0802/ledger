// ── FILM GENRE → DIMENSION MAP ───────────────────────────────────────────────
// Maps a TMDB genre name (lowercased) to the 8 universal taste dimensions it
// most foregrounds. Used by analog selection (for film targets) and by the film
// recommender's dim-emphasis inference (no per-title tag-genome required).
// Hand-mapped — coherent rather than learned.

export const FILM_GENRE_DIMENSIONS = {
  'action':          ['experience', 'world'],
  'adventure':       ['experience', 'world', 'story'],
  'science fiction': ['world', 'singularity', 'story'],
  'fantasy':         ['world', 'hold', 'singularity'],
  'drama':           ['story', 'performance', 'ending'],
  'thriller':        ['experience', 'hold', 'ending'],
  'horror':          ['world', 'hold', 'experience'],
  'romance':         ['performance', 'experience', 'ending'],
  'comedy':          ['experience', 'performance'],
  'mystery':         ['story', 'ending', 'hold'],
  'crime':           ['story', 'ending', 'hold'],
  'animation':       ['world', 'craft', 'singularity'],
  'documentary':     ['story', 'craft', 'singularity'],
  'war':             ['story', 'world', 'performance'],
  'history':         ['story', 'world', 'performance'],
  'music':           ['experience', 'performance', 'world'],
  'family':          ['experience', 'performance', 'world'],
  'western':         ['world', 'craft', 'singularity'],
};
