// Unit tests for the film safe/upside scoring decomposition.
// Run: node tests/film-scorer.test.mjs

import {
  alignmentScore, definingPositiveOverlap, definingNegativeReliance,
  boundaryPenalty, peakiness, upsideTerm, directionalFeatures,
} from '../src/modules/scoring/shape-fit.js';
import { inferFilmDimensions, decomposeFilmScore, rankFilmsSafeUpside, assembleSafeUpsideShelves } from '../src/modules/film-scorer.js';

let passed = 0, failed = 0;
const assert = (cond, label) => { if (cond) passed++; else { failed++; console.error(`  FAIL: ${label}`); } };

// ── shape-fit pure helpers ──
const summaryWorldHold = {
  definingPositive: [{ cat: 'world' }, { cat: 'hold' }],
  definingNegative: [{ cat: 'comedy' }, { cat: 'experience' }],
};
const candWorldHeavy = { world: 1, hold: 0.8, story: 0.4, craft: 0.3, performance: 0.2, experience: 0.1, ending: 0.3, singularity: 0.6 };
const candComedyHeavy = { experience: 1, performance: 0.9, story: 0.3, craft: 0.2, world: 0.1, hold: 0.1, ending: 0.3, singularity: 0.2 };

assert(definingPositiveOverlap(candWorldHeavy, summaryWorldHold) > 0.6, 'world/hold-heavy candidate hits defining-positive');
assert(definingPositiveOverlap(candComedyHeavy, summaryWorldHold) < 0.3, 'experience-heavy candidate misses defining-positive');
assert(definingNegativeReliance(candComedyHeavy, summaryWorldHold) > 0, 'experience-heavy candidate triggers negative reliance');
assert(boundaryPenalty(candComedyHeavy, summaryWorldHold) > 0, 'boundary penalty applied');
assert(peakiness(candWorldHeavy) > 0, 'peakiness measured');
assert(upsideTerm({ singularity: 1, hold: 1, world: 0.2, story: 0.2 }) > 0.4, 'singularity+hold heavy → upside term high');

// ── inferFilmDimensions ──
const dimsScifi = inferFilmDimensions({ genres: 'Science Fiction' });
assert(dimsScifi.world > 0 && dimsScifi.singularity > 0, 'sci-fi infers world+singularity');
const dimsComedy = inferFilmDimensions({ genres: 'Comedy' });
assert(dimsComedy.experience === 1 && dimsComedy.world === 0, 'comedy infers experience, not world');

// ── decomposeFilmScore + safe/upside split ──
const tasteSummary = summaryWorldHold;
const weights = { story: 2.5, craft: 2.5, performance: 2.5, world: 4.0, experience: 2.0, hold: 4.0, ending: 2.5, singularity: 3.0 };
const knownDirectors = new Set(['villeneuve']);
const knownCast = new Set([]);

// A safe candidate: well-aligned (sci-fi/world), familiar director, mid metadata.
const safeCandidate = {
  tmdbId: 1, title: 'Familiar World Film', year: 2018, director: 'Villeneuve',
  cast: 'A, B', genres: 'Science Fiction, Drama', overview: 'A story about people.', vote_average: 7.4,
};
// An upside candidate: less aligned but very singular + held, unknown director, high ceiling.
const upsideCandidate = {
  tmdbId: 2, title: 'Singular Underdog', year: 2021, director: 'Newcomer',
  cast: '', genres: 'Science Fiction', overview: 'A haunting singular vision.', vote_average: 8.5,
};
// A clear miss: leans on user's cool categories, no familiarity.
const missCandidate = {
  tmdbId: 3, title: 'Pure Slapstick', year: 2022, director: 'Someone',
  cast: '', genres: 'Comedy', overview: 'Light fluffy comedy.', vote_average: 6.0,
};

const ctx = { baseScoreFn: () => 65, tasteSummary, weights, knownDirectors, knownCast };
const ranked = rankFilmsSafeUpside([safeCandidate, upsideCandidate, missCandidate], ctx);

assert(ranked.safe[0].film.tmdbId === safeCandidate.tmdbId, 'safe lane: well-aligned + familiar film wins');
assert(ranked.upside[0].film.tmdbId === upsideCandidate.tmdbId, 'upside lane: singular + ceiling film wins');
assert(ranked.safe[0].film.tmdbId !== ranked.upside[0].film.tmdbId, 'safe ≠ upside top pick (real lane distinction)');
assert(ranked.safe.find(x => x.film.tmdbId === missCandidate.tmdbId).safeScore < ranked.safe[0].safeScore, 'cool-category film is downranked in safe');

// Feature inspection
const dec = decomposeFilmScore({ film: upsideCandidate, baseScore: 65, tasteSummary, weights, knownDirectors, knownCast, ratingsAverage: 8.5 });
assert('alignment' in dec.features && 'upsideTerm' in dec.features && 'boundaryPenalty' in dec.features, 'features expose named contributions');
assert(dec.features.upsideTerm > dec.features.boundaryPenalty, 'upside candidate: upside term outweighs boundary penalty');

// Diversity: assembled shelves should not duplicate films, and upside should
// exclude any film already on the safe shelf.
const { safeShelf, upsideShelf } = assembleSafeUpsideShelves({ safe: ranked.safe, upside: ranked.upside, safeN: 2, upsideN: 2 });
const safeIds = new Set(safeShelf.map(it => String(it.film.tmdbId)));
assert(upsideShelf.every(it => !safeIds.has(String(it.film.tmdbId))), 'upside shelf excludes films already on the safe shelf');

// ── The headline behavioral claim: an upside film outranks safe in upside lane
// but not in safe lane (real lane distinction, not cosmetic sort) ──
const upsideRank = ranked.upside.findIndex(x => x.film.tmdbId === upsideCandidate.tmdbId);
const safeRankOfUpside = ranked.safe.findIndex(x => x.film.tmdbId === upsideCandidate.tmdbId);
const safeRankOfSafe = ranked.safe.findIndex(x => x.film.tmdbId === safeCandidate.tmdbId);
assert(upsideRank === 0 && safeRankOfSafe < safeRankOfUpside, 'upside-leaning film wins upside lane but loses safe lane (and vice versa) — real split');

console.log(`\nfilm-scorer: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
