// ── FILM SCORER (Stage B for film: safe + upside decomposition) ──────────────
// The film recommender's "single fit objective" is replaced with two distinct
// objectives that share named feature contributions, mirroring the books
// recommender philosophically via the SHARED shape-fit helpers. We deliberately
// REUSE the existing film candidate pipeline:
//   - existing `scoreCandidate` returns a blended familiarity/genre/era fit (0-100)
//     → consumed here as the `base` feature (alignment evidence from real data)
//   - we ADD directional taste-shape features (defining +/- overlap, boundary,
//     peakiness, upsideTerm) from shape-fit.js, and film-specific signals
//     (familiarity from entity overlap, novelty = 1-familiarity, confidence
//     from metadata richness).
//
// Outputs:
//   features      — every named contribution, fully inspectable
//   safeScore     — rewards alignment + defining-positive overlap + familiarity
//                   + confidence; FULL boundary penalty
//   upsideScore   — rewards peakiness + upsideTerm + (modest) alignment + mild
//                   novelty; HALF boundary penalty (favorite-energy tolerates
//                   somewhat lower certainty)
//
// Pure: no DOM, no localStorage, no network → node-testable.

import { FILM_GENRE_DIMENSIONS } from '../data/film-genre-dimensions.js';
import { CAT_KEYS, directionalFeatures } from './scoring/shape-fit.js';

/**
 * Infer a 0..1 emphasis vector for a film candidate from its TMDB genres.
 * (Pre-prediction we don't have category scores, so genre-derived dims are the
 * best cheap signal of "what trait register does this film foreground?")
 */
export function inferFilmDimensions(film) {
  const genres = (film?.genres || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const tally = Object.fromEntries(CAT_KEYS.map(c => [c, 0]));
  for (const g of genres) {
    for (const d of (FILM_GENRE_DIMENSIONS[g] || [])) tally[d]++;
  }
  const max = Math.max(...Object.values(tally), 1);
  return Object.fromEntries(CAT_KEYS.map(c => [c, max ? tally[c] / max : 0]));
}

const r3 = x => Math.round((x || 0) * 1000) / 1000;
const lower = s => String(s || '').toLowerCase();
const splitNames = s => lower(s).split(',').map(t => t.trim()).filter(Boolean);

/**
 * Decompose a film candidate into safe / upside scores with named features.
 *
 * @param {object} opts
 * @param {object} opts.film               - candidate film
 * @param {number} [opts.baseScore=0]      - legacy `scoreCandidate(film)` 0-100 result
 * @param {object} [opts.tasteSummary]     - from buildTasteSummary
 * @param {object} [opts.weights]          - currentUser.weights
 * @param {Set}    [opts.knownDirectors]   - lowercased director names from MOVIES
 * @param {Set}    [opts.knownCast]        - lowercased cast names from MOVIES
 * @param {number} [opts.ratingsAverage=0] - TMDB vote_average (~0-10) if present
 *
 * @returns {{ features, safeScore, upsideScore }}
 */
export function decomposeFilmScore({ film, baseScore = 0, tasteSummary, weights, knownDirectors, knownCast, ratingsAverage = 0 } = {}) {
  const candidateDims = inferFilmDimensions(film);

  // TMDB ratings_average is roughly 5–9 for real titles → map "near-ceiling"
  // range into 0..1 as a ceiling signal for upsideTerm.
  const ceilingSignal = ratingsAverage > 0 ? Math.max(0, Math.min(1, (ratingsAverage - 6.5) / 2.5)) : 0;
  const dir = directionalFeatures({ candidateDims, summary: tasteSummary, userWeights: weights, ceilingSignal });

  // `base` is the legacy scoreCandidate output normalized to 0..1 — it captures
  // entity affinity (director/cast/writer/company) + genre + era, all from REAL
  // user data. Treat it as the primary alignment evidence for the safe lane.
  const base = Math.max(0, Math.min(1, (baseScore || 0) / 100));

  // Familiarity from entity overlap (an additive signal alongside the base
  // score, used both for the safe lane and to derive novelty for the upside).
  const dirs = splitNames(film?.director);
  const cast = splitNames(film?.cast).slice(0, 5);
  const dirHits = dirs.filter(n => knownDirectors?.has(n)).length;
  const castHits = cast.filter(n => knownCast?.has(n)).length;
  const familiarity = Math.min(1, dirHits * 0.6 + castHits * 0.12);
  const novelty = 1 - familiarity;

  // Confidence: how much metadata supports the safe-fit case for this candidate.
  const confidence = Math.min(1,
    (dirs.length ? 0.40 : 0) +
    (cast.length ? 0.25 : 0) +
    (film?.genres ? 0.15 : 0) +
    (film?.overview ? 0.20 : 0));

  // Safe lane: broad alignment + defining-positive overlap + familiarity +
  // confidence-weighted reliability. Full boundary penalty.
  const safeScore =
    0.40 * base +
    0.28 * dir.definingPositiveOverlap +
    0.14 * familiarity +
    0.18 * (0.6 + 0.4 * confidence) -
    dir.boundaryPenalty;

  // Upside lane: peak fit + favorite-energy signals; tolerates somewhat lower
  // certainty (novelty allowed; half boundary penalty); base contributes
  // partially so we don't surface total mismatches.
  const upsideScore =
    0.22 * base +
    0.55 * dir.upsideTerm +
    0.20 * dir.peakiness +
    0.10 * novelty +
    0.10 * dir.definingPositiveOverlap -
    0.5 * dir.boundaryPenalty;

  return {
    features: {
      base: r3(base),
      alignment: r3(dir.alignment),
      definingPositiveOverlap: r3(dir.definingPositiveOverlap),
      definingNegativeReliance: r3(dir.definingNegativeReliance),
      boundaryPenalty: r3(dir.boundaryPenalty),
      peakiness: r3(dir.peakiness),
      upsideTerm: r3(dir.upsideTerm),
      familiarity: r3(familiarity),
      novelty: r3(novelty),
      confidence: r3(confidence),
      candidateDims,
    },
    safeScore: r3(safeScore),
    upsideScore: r3(upsideScore),
  };
}

/**
 * Rank a candidate pool by safe and upside objectives. Returns two ordered
 * arrays so the caller can assemble two distinct shelves (with overlap
 * deliberately small — picking the same film for both lanes is a bad signal).
 *
 * @param {Array} candidates
 * @param {object} ctx              - shared per-call context
 * @param {(film:object)=>number} ctx.baseScoreFn - returns scoreCandidate(film) for a candidate
 * @returns {{ safe, upside, scored }}
 *   safe/upside entries are { film, features, safeScore, upsideScore } sorted desc.
 */
export function rankFilmsSafeUpside(candidates, ctx) {
  const scored = (candidates || []).map(film => {
    const baseScore = ctx.baseScoreFn ? ctx.baseScoreFn(film) : 0;
    const d = decomposeFilmScore({
      film, baseScore,
      tasteSummary: ctx.tasteSummary,
      weights: ctx.weights,
      knownDirectors: ctx.knownDirectors,
      knownCast: ctx.knownCast,
      ratingsAverage: film?.vote_average ?? film?.ratingsAverage ?? 0,
    });
    return { film, ...d };
  });
  const safe = [...scored].sort((a, b) => b.safeScore - a.safeScore);
  const upside = [...scored].sort((a, b) => b.upsideScore - a.upsideScore);
  return { safe, upside, scored };
}

/**
 * Assemble two shelves from a ranked pool, with deliberate diversity:
 *   - safe shelf  = top-N by safeScore
 *   - upside shelf = top-M by upsideScore, EXCLUDING any film already on the safe
 *     shelf (so the two lanes feel different by construction)
 *
 * Optional director-cap (max 1 per director per shelf) keeps shelves spread.
 */
export function assembleSafeUpsideShelves({ safe, upside, safeN = 5, upsideN = 5, maxPerDirector = 1 } = {}) {
  const pickDiverse = (ranked, n, exclude = new Set()) => {
    const out = [];
    const seenIds = new Set();
    const dirCount = {};
    for (const it of ranked) {
      const id = String(it.film.tmdbId || it.film.id || it.film.title);
      if (exclude.has(id) || seenIds.has(id)) continue;
      const dir = lower(it.film.director).split(',')[0]?.trim() || '';
      if (dir && (dirCount[dir] || 0) >= maxPerDirector) continue;
      out.push(it);
      seenIds.add(id);
      if (dir) dirCount[dir] = (dirCount[dir] || 0) + 1;
      if (out.length >= n) break;
    }
    return out;
  };

  const safeShelf = pickDiverse(safe, safeN);
  const safeIds = new Set(safeShelf.map(it => String(it.film.tmdbId || it.film.id || it.film.title)));
  const upsideShelf = pickDiverse(upside, upsideN, safeIds);
  return { safeShelf, upsideShelf };
}
