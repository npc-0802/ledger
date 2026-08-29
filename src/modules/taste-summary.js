// ── TASTE SUMMARY ────────────────────────────────────────────────────────────
// A structured representation of a user's WHOLE taste profile — built so that
// prediction prompts reason from the full weighted pattern (macro tendencies +
// micro boundaries) instead of name-dropping the same 3–5 favorites.
//
// Everything here is pure: pass in the rated items + weights and get structured
// data back. That keeps it unit-testable and reusable across mediums (film,
// book, …) — the underlying rated pool is film in Phase 1, but the shape is
// medium-agnostic and labels are resolved per medium.
//
// Three layers:
//   buildTasteSummary()         — macro pattern: averages, defining +/- prefs,
//                                 loved/admired/rejected clusters, boundaries, tensions
//   selectExamplesByCategories()— micro: trait-relevant affirming + cautionary works
//   formatTasteSummary() / formatRelevantExamples() — prompt text

import { MOVIES, CATEGORIES, currentUser } from '../state.js';
import { getCategoryLabel } from '../data/category-descriptions.js';

const CAT_KEYS = CATEGORIES.map(c => c.key);
const NEUTRAL = 2.5;

// Confidence weight for one observation — mirrors weight-blend.getFilmObservationWeight,
// inlined so this module stays dependency-light and unit-testable in isolation:
// pairwise-inferred scores are discounted by their per-category calibration
// confidence (0.25 fallback); manual/guided/legacy ratings count fully.
function observationWeight(m, cat) {
  if (m?.rating_source === 'onboarding_pairwise') {
    const c = m.calibration_confidence?.[cat];
    return (typeof c === 'number' && c > 0) ? c : 0.25;
  }
  return 1.0;
}

// Compact, medium-aware label ("The Characters" → "Characters").
function shortLabel(key, medium) {
  return getCategoryLabel(key, medium).replace(/^The\s+/i, '');
}

// Confidence-weighted mean for one category (pairwise-inferred films discounted).
function weightedMean(items, cat) {
  let wSum = 0, wTot = 0;
  for (const m of items) {
    const s = m.scores?.[cat];
    if (s == null) continue;
    const w = observationWeight(m, cat);
    wSum += s * w; wTot += w;
  }
  return wTot ? wSum / wTot : null;
}

// High-trust rated pool (excludes low-confidence pairwise bootstrap data when
// there's enough signal without it).
function ratedPool(movies) {
  const rated = movies.filter(m => m.scores && m.total != null);
  const highTrust = rated.filter(m => m.rating_source !== 'onboarding_pairwise');
  return highTrust.length >= 5 ? highTrust : rated;
}

/**
 * Build a structured taste summary from the user's whole rated dataset.
 * @param {object} opts
 * @param {Array}  opts.movies  - rated items (default MOVIES)
 * @param {object} opts.weights - effective category weights (default currentUser.weights)
 * @param {string} opts.medium  - label medium ('film' | 'book' | …)
 */
export function buildTasteSummary({ movies = MOVIES, weights = currentUser?.weights || null, medium = 'film' } = {}) {
  const pool = ratedPool(movies);
  const totalRated = pool.length;
  const L = k => shortLabel(k, medium);

  const categoryAverages = {};
  CAT_KEYS.forEach(c => { const mu = weightedMean(pool, c); if (mu != null) categoryAverages[c] = Math.round(mu); });

  // Defining preferences = categories whose weight deviates most from neutral.
  const devs = CAT_KEYS
    .map(c => ({ cat: c, label: L(c), weight: weights?.[c] ?? NEUTRAL, dev: (weights?.[c] ?? NEUTRAL) - NEUTRAL }))
    .sort((a, b) => Math.abs(b.dev) - Math.abs(a.dev));
  const definingPositive = devs.filter(d => d.dev >= 0.3).slice(0, 3);
  const definingNegative = devs.filter(d => d.dev <= -0.3).slice(0, 2);

  // Clusters across the distribution — not just the top.
  const byTotal = [...pool].sort((a, b) => b.total - a.total);
  const loved = byTotal.slice(0, 4);
  const rejected = byTotal.slice(-3).reverse();
  const lovedSet = new Set(loved);
  const rejSet = new Set(rejected);

  // Admired-but-not-loved: strong in a defining-positive category, yet only mid overall.
  const posCats = definingPositive.map(d => d.cat);
  const admired = posCats.length
    ? pool.filter(m => !lovedSet.has(m) && !rejSet.has(m) && m.total >= 55 && m.total <= 74 &&
        posCats.some(c => (m.scores[c] ?? 0) >= (categoryAverages[c] ?? 70) + 8))
        .sort((a, b) => b.total - a.total).slice(0, 3)
    : [];

  // Tolerance boundaries — where the line actually is.
  const boundaries = [];
  definingPositive.forEach(d => {
    const f = pool.filter(m => (m.scores[d.cat] ?? 0) >= 80 && m.total <= 62)
      .sort((a, b) => (b.scores[d.cat] ?? 0) - (a.scores[d.cat] ?? 0))[0];
    if (f) boundaries.push(`Strong ${L(d.cat)} alone doesn't win you over — ${f.title} hit ${f.scores[d.cat]} there but landed at ${Math.round(f.total)} overall.`);
  });
  definingNegative.forEach(d => {
    const f = pool.filter(m => (m.scores[d.cat] ?? 100) <= 55 && m.total >= 75)
      .sort((a, b) => b.total - a.total)[0];
    if (f) boundaries.push(`You don't need ${L(d.cat)} — ${f.title} is light there (${f.scores[d.cat]}) yet you rate it ${Math.round(f.total)}.`);
  });

  // Tensions / fault lines.
  const tensions = [];
  if (definingPositive[0] && definingNegative[0]) {
    tensions.push(`You lean on ${L(definingPositive[0].cat)} and run cool on ${L(definingNegative[0].cat)} — work that trades ${L(definingPositive[0].cat)} away for ${L(definingNegative[0].cat)} tends to lose you.`);
  }
  if (definingPositive.length >= 2) {
    tensions.push(`${L(definingPositive[0].cat)} and ${L(definingPositive[1].cat)} usually have to arrive together; one without the other reads as a near-miss.`);
  }

  return {
    medium, totalRated, weights, categoryAverages,
    definingPositive, definingNegative,
    clusters: { loved, admired, rejected },
    boundaries, tensions,
  };
}

/**
 * Select trait-relevant example works for a specific prediction.
 * @returns {{ affirming: Array, cautionary: Array }}
 *   affirming  — works strong in these categories that the user also loved
 *   cautionary — works strong in these categories the user did NOT love (boundary cases)
 */
export function selectExamplesByCategories({ movies = MOVIES, categories = [], n = 3 } = {}) {
  const pool = ratedPool(movies).filter(m => categories.some(c => m.scores?.[c] != null));
  if (!categories.length || !pool.length) return { affirming: [], cautionary: [] };

  const catAvg = {};
  categories.forEach(c => { catAvg[c] = weightedMean(pool, c) ?? 70; });
  const traitStrength = m => categories.reduce((s, c) => s + ((m.scores[c] ?? catAvg[c]) - catAvg[c]), 0);

  // Split by the user's OWN rating median so "loved" is relative to them, not an
  // absolute cutoff. Affirming = trait-forward works in their upper half;
  // cautionary = trait-strong works in their lower half (admired-not-loved / boundary).
  const totals = pool.map(m => m.total).sort((a, b) => a - b);
  const median = totals[Math.floor(totals.length / 2)];

  const affirming = pool.filter(m => m.total >= median)
    .sort((a, b) => traitStrength(b) - traitStrength(a))
    .slice(0, n);
  const affirmingSet = new Set(affirming);

  const cautionary = pool.filter(m => !affirmingSet.has(m) && m.total < median &&
      categories.some(c => (m.scores[c] ?? 0) >= catAvg[c] + 6))
    .sort((a, b) => traitStrength(b) - traitStrength(a))
    .slice(0, 2);

  return { affirming, cautionary };
}

// ── Prompt formatting ─────────────────────────────────────────────────────────

const titles = arr => (arr || []).map(m => `${m.title} (${Math.round(m.total)})`).join(', ');

export function formatTasteSummary(summary, medium = 'film') {
  if (!summary || !summary.totalRated) return '';
  const L = k => shortLabel(k, medium);
  const avgStr = Object.entries(summary.categoryAverages).map(([c, v]) => `${L(c)} ${v}`).join(', ');
  const pos = summary.definingPositive.map(d => `${L(d.cat)} (+${d.dev.toFixed(1)})`).join(', ') || '—';
  const neg = summary.definingNegative.map(d => `${L(d.cat)} (${d.dev.toFixed(1)})`).join(', ') || '—';

  let out = `TASTE SUMMARY (from ${summary.totalRated} rated works — reason from the WHOLE pattern, not a shortlist):
Category averages: ${avgStr}
Leans into: ${pos}
Runs cool on: ${neg}
Lands hardest: ${titles(summary.clusters.loved) || '—'}`;
  if (summary.clusters.admired.length) out += `\nRespected but not loved: ${titles(summary.clusters.admired)}`;
  if (summary.clusters.rejected.length) out += `\nLeaves them cold: ${titles(summary.clusters.rejected)}`;
  if (summary.boundaries.length) out += `\nWhere the line is:\n${summary.boundaries.map(b => `- ${b}`).join('\n')}`;
  if (summary.tensions.length) out += `\nTensions:\n${summary.tensions.map(t => `- ${t}`).join('\n')}`;
  return out;
}

export function formatRelevantExamples(examples, label = 'this work') {
  if (!examples) return '';
  let s = '';
  if (examples.affirming?.length) s += `\nMost relevant works they loved (and why ${label} echoes them): ${titles(examples.affirming)}`;
  if (examples.cautionary?.length) s += `\nRelevant works they admired but didn't love (boundary cases): ${titles(examples.cautionary)}`;
  return s;
}
