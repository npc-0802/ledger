// ── Weight Blending ──
// Bayesian decay: blends quiz-derived weights with rating-derived weights.
// Quiz influence decays as films are rated; rating signal grows.

import { MOVIES, currentUser, setCurrentUser, CATEGORIES, recalcAllTotals } from '../state.js';
import { saveUserLocally } from './supabase.js';
import { classifyArchetype } from './quiz-engine.js';

const DECAY_RATE = 0.15;
const MAX_SNAPSHOTS = 500;

/**
 * Record a weight distribution snapshot for historical tracking.
 * Triggers: 'onboarding' (quiz finish), 'rating' (film rated/calibrated),
 *           'manual' (user edited weights in archetype modal).
 * Stored on currentUser.weight_history as a compact array.
 */
export function recordWeightSnapshot(trigger, opts = {}) {
  if (!currentUser) return;
  const weights = currentUser.weights;
  if (!weights) return;

  const history = currentUser.weight_history || [];

  // Dedupe: skip if weights haven't actually changed since last snapshot
  const last = history[history.length - 1];
  if (last && trigger === 'rating') {
    const same = CATEGORIES.every(c =>
      Math.abs((last.w[c.key] || 0) - (weights[c.key] || 0)) < 0.01
    );
    if (same) return;
  }

  const snapshot = {
    t: Date.now(),
    trigger,
    n: MOVIES.length,                    // films rated at this point
    w: {},                               // weight distribution (compact)
    arch: currentUser.archetype || null,  // palate type at this point
    adj: currentUser.adjective || null,   // adjective at this point
  };
  for (const cat of CATEGORIES) {
    snapshot.w[cat.key] = Math.round((weights[cat.key] || 0) * 1000) / 1000;
  }

  // For onboarding, also capture quiz_weights as the baseline
  if (trigger === 'onboarding') {
    snapshot.qw = {};
    const qw = currentUser.quiz_weights || weights;
    for (const cat of CATEGORIES) {
      snapshot.qw[cat.key] = Math.round((qw[cat.key] || 0) * 1000) / 1000;
    }
  }

  // For rating triggers, capture the decay factor and rating-derived weights
  if (trigger === 'rating' && currentUser.rating_weights) {
    snapshot.decay = Math.round((1.0 / (1.0 + MOVIES.length * DECAY_RATE)) * 1000) / 1000;
    snapshot.rw = {};
    for (const cat of CATEGORIES) {
      snapshot.rw[cat.key] = Math.round((currentUser.rating_weights[cat.key] || 0) * 1000) / 1000;
    }
  }

  history.push(snapshot);

  // Trim oldest entries if over cap (keep first entry as baseline)
  if (history.length > MAX_SNAPSHOTS) {
    const baseline = history[0];
    history.splice(0, history.length - MAX_SNAPSHOTS);
    if (history[0].trigger !== 'onboarding') history.unshift(baseline);
  }

  setCurrentUser({ ...currentUser, weight_history: history });
}

/**
 * Derive weights from the variance in per-category scores across all rated films.
 * High variance = user discriminates on this category = they care about it.
 * Returns null if fewer than 3 films rated.
 */
export function computeRatingWeights() {
  if (MOVIES.length < 3) return null;

  const variances = {};
  for (const cat of CATEGORIES) {
    const scores = MOVIES.map(m => m.scores?.[cat.key]).filter(s => s != null);
    if (scores.length < 3) continue;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, s) => a + (s - mean) ** 2, 0) / scores.length;
    variances[cat.key] = variance;
  }

  const vals = Object.values(variances);
  if (vals.length === 0) return null;

  const maxVar = Math.max(...vals, 0.01);
  const minVar = Math.min(...vals);

  const weights = {};
  for (const cat of CATEGORIES) {
    const v = variances[cat.key] ?? 0;
    weights[cat.key] = maxVar > minVar
      ? 1.5 + ((v - minVar) / (maxVar - minVar)) * 3.0
      : 2.5;
  }

  return weights;
}

/**
 * Blend quiz weights and rating-derived weights using Bayesian decay.
 * Updates currentUser.weights, currentUser.rating_weights, and persists.
 * Call after every film rating or calibration.
 */
export function updateEffectiveWeights() {
  if (!currentUser) return;

  const filmsRated = MOVIES.length;
  const quizWeights = currentUser.quiz_weights;

  // If no quiz weights stored (legacy user), nothing to blend
  if (!quizWeights) return;

  const ratingWeights = computeRatingWeights();
  const decay = 1.0 / (1.0 + filmsRated * DECAY_RATE);

  let effective;
  if (!ratingWeights) {
    // Not enough films — quiz weights are all we have
    effective = { ...quizWeights };
  } else {
    // Blend quiz and rating-derived weights
    effective = {};
    for (const cat of CATEGORIES) {
      const qw = quizWeights[cat.key] ?? 2.5;
      const rw = ratingWeights[cat.key] ?? 2.5;
      effective[cat.key] = qw * decay + rw * (1.0 - decay);
    }
  }

  // Recompute archetype from effective weights
  const classification = classifyArchetype(effective);
  const prevArchetype = currentUser.archetype;

  // Update user
  setCurrentUser({
    ...currentUser,
    weights: effective,
    rating_weights: ratingWeights,
    films_rated: filmsRated,
    archetype: classification.archetype,
    archetype_secondary: classification.secondary || '',
    archetype_key: classification.archetypeKey,
    adjective: classification.adjective,
    full_archetype_name: classification.fullName,
  });

  // Recalc all totals with new weights
  recalcAllTotals();
  recordWeightSnapshot('rating');
  saveUserLocally();

  // Toast on archetype change
  if (prevArchetype && classification.archetype !== prevArchetype) {
    const label = classification.fullName || classification.archetype;
    window.showToast?.(`Your palate type shifted → ${label}`, { duration: 5000 });
  }
}
