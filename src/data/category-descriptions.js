// ── PER-MEDIUM CATEGORY DESCRIPTIONS ─────────────────────────────────────────
// The 8 scoring keys are universal across every medium (see data/categories.js).
// Only the human-facing label and question change per medium. This file is the
// single source of truth for that medium-aware copy.
//
// Phase 1 ships film + book. `tv` / `music` are reserved for later phases and
// intentionally absent — getCategoryDescriptions() falls back to film copy for
// any medium not yet authored, so callers never crash on an unknown medium.

export const CATEGORY_KEYS = [
  'story', 'craft', 'performance', 'world', 'experience', 'hold', 'ending', 'singularity',
];

export const CATEGORY_DESCRIPTIONS = {
  film: {
    story:       { label: 'The Story',        question: 'How much did you like what happens in this film?' },
    craft:       { label: 'The Craft',        question: 'How well was this film made?' },
    performance: { label: 'The Performances', question: 'How compelling are the people in this film?' },
    world:       { label: 'The World',        question: 'How much does this film\'s world pull you in?' },
    experience:  { label: 'The Experience',   question: 'How much did you enjoy watching this?' },
    hold:        { label: 'The Hold',         question: 'Does this film have a hold on you?' },
    ending:      { label: 'The Ending',       question: 'How do you feel about where this film left you?' },
    singularity: { label: 'The Singularity',  question: 'How much does this film stand alone?' },
  },
  book: {
    story:       { label: 'The Story',      question: 'How much did the narrative work for you?' },
    craft:       { label: 'The Craft',      question: 'How strong is the writing and structure?' },
    performance: { label: 'The Characters', question: 'How compelling are the people in this book?' },
    world:       { label: 'The World',      question: 'How much does this book\'s world pull you in?' },
    experience:  { label: 'The Experience', question: 'How much did you enjoy reading this?' },
    hold:        { label: 'The Hold',       question: 'Does this book have a hold on you?' },
    ending:      { label: 'The Ending',     question: 'How do you feel about where this book left you?' },
    singularity: { label: 'The Singularity', question: 'How much does this book stand alone?' },
  },
};

/**
 * Resolve the label/question set for a medium, falling back to film copy for any
 * medium not yet authored (e.g. future 'tv' / 'music').
 * @param {string} medium - 'film' | 'book' | ...
 * @returns {{ [key: string]: { label: string, question: string } }}
 */
export function getCategoryDescriptions(medium = 'film') {
  return CATEGORY_DESCRIPTIONS[medium] || CATEGORY_DESCRIPTIONS.film;
}

/** Convenience: just the label for one category in one medium. */
export function getCategoryLabel(key, medium = 'film') {
  return getCategoryDescriptions(medium)[key]?.label || key;
}
