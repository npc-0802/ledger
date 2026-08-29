// ── SHARED DIRECTIONAL TASTE-SHAPING ─────────────────────────────────────────
// Pure, medium-agnostic helpers used by BOTH the books recommender and the film
// recommender so the two systems don't drift into separate philosophies. Each
// helper takes a candidate's 0..1 dimension emphasis vector (`candidateDims`)
// plus a taste summary (from taste-summary.buildTasteSummary) and returns a
// named, inspectable feature.
//
// These features are the building blocks of the safe / upside split:
//   safe   = alignment + definingPositiveOverlap + confidence − boundaryPenalty
//   upside = peakiness + upsideTerm + (modest) alignment − (lighter) boundaryPenalty
//
// No DOM, no localStorage, no network — fully node-testable.

export const CAT_KEYS = ['story', 'craft', 'performance', 'world', 'experience', 'hold', 'ending', 'singularity'];

/**
 * Cosine of candidate dim emphasis vs the user's weight-emphasis vector.
 * Returns 0..1. This is the "broad taste alignment" signal.
 */
export function alignmentScore(candidateDims, userWeights) {
  if (!candidateDims || !userWeights) return 0;
  let dot = 0, cm = 0, um = 0;
  for (const k of CAT_KEYS) {
    const c = candidateDims[k] || 0;
    const u = Math.max(0, (userWeights[k] ?? 2.5) - 2.5); // emphasis above neutral
    dot += c * u; cm += c * c; um += u * u;
  }
  return (cm && um) ? dot / (Math.sqrt(cm) * Math.sqrt(um)) : 0;
}

/**
 * How much of the candidate's emphasis lands on the user's defining-POSITIVE
 * categories. Higher = the candidate leans into traits the user is known to care
 * most about → strong safe-fit signal.
 */
export function definingPositiveOverlap(candidateDims, summary) {
  const pos = (summary?.definingPositive || []).map(d => d.cat);
  if (!pos.length || !candidateDims) return 0;
  let sum = 0;
  for (const c of pos) sum += candidateDims[c] || 0;
  return Math.min(1, sum / pos.length);
}

/**
 * How much of the candidate's emphasis lands on the user's defining-NEGATIVE
 * categories. Higher = the candidate leans on traits the user is cool on →
 * downside risk. Returned 0..1; the caller scales it into a penalty.
 */
export function definingNegativeReliance(candidateDims, summary) {
  const neg = (summary?.definingNegative || []).map(d => d.cat);
  if (!neg.length || !candidateDims) return 0;
  // Look at the candidate's TOP 3 dims and count overlap with negative cats.
  const top = Object.entries(candidateDims).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  let hits = 0;
  for (const k of top) if (neg.includes(k)) hits++;
  return Math.min(1, hits / Math.max(1, top.length));
}

/**
 * Translate negative reliance into a bounded penalty (0..maxPenalty). Used by
 * both safe (full) and upside (halved) score paths.
 */
export function boundaryPenalty(candidateDims, summary, maxPenalty = 0.45) {
  return Math.min(maxPenalty, definingNegativeReliance(candidateDims, summary) * maxPenalty);
}

/**
 * Peakiness = max(dims) − mean(dims). A spiky profile is favorite-energy: the
 * thing is distinctly strong on one trait rather than bland-balanced.
 */
export function peakiness(candidateDims) {
  const vals = Object.values(candidateDims || {});
  if (!vals.length) return 0;
  const max = Math.max(...vals);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.max(0, max - mean);
}

/**
 * Upside term blends peakiness with singularity + hold emphasis (the two cats
 * most associated with "this could overperform expected fit"), and tolerates an
 * optional external `ceilingSignal` (e.g. TMDB ratings_average for film, or
 * Open Library ratings for books) when present.
 */
export function upsideTerm(candidateDims, { ceilingSignal = 0 } = {}) {
  if (!candidateDims) return 0;
  const peak = peakiness(candidateDims);
  const singHold = ((candidateDims.singularity || 0) * 0.5 + (candidateDims.hold || 0) * 0.5);
  const ceil = Math.max(0, Math.min(1, ceilingSignal));
  return Math.min(1, peak * 0.50 + singHold * 0.35 + ceil * 0.30);
}

/**
 * One-shot helper that returns every directional feature at once. Both the film
 * scorer and the books reranker call this so the named contributions are
 * computed identically in both systems.
 */
export function directionalFeatures({ candidateDims, summary, userWeights, ceilingSignal = 0, maxBoundaryPenalty = 0.45 } = {}) {
  return {
    alignment: alignmentScore(candidateDims, userWeights),
    definingPositiveOverlap: definingPositiveOverlap(candidateDims, summary),
    definingNegativeReliance: definingNegativeReliance(candidateDims, summary),
    boundaryPenalty: boundaryPenalty(candidateDims, summary, maxBoundaryPenalty),
    peakiness: peakiness(candidateDims),
    upsideTerm: upsideTerm(candidateDims, { ceilingSignal }),
  };
}
