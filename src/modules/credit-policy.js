// ── CREDIT POLICY ────────────────────────────────────────────────────────
// Unified monthly credit pool for all Claude API usage (predictions + insights).
// One module controls: whether a call is allowed, credit tracking, source gating.
//
// Tier ladder (user-facing):
//   free     — beta default, tightens for public launch
//   pro      — paying users, generous cap, all surfaces
//   premium  — highest cap, all surfaces, priority features
//
// Internal overrides:
//   founder  — resolves to premium via FOUNDER_EMAILS allowlist
//   Legacy 'paid' in Supabase → normalized to 'pro'
//
// To change limits: edit CREDIT_LIMITS / SOURCE_GATES below.

import { currentUser } from '../state.js';
import { track } from '../analytics.js';

// ── Founder allowlist ─────────────────────────────────────────────────────
const FOUNDER_EMAILS = [
  'noahparikhcott@gmail.com',
];

// ── Credit limits (monthly only — no daily caps) ─────────────────────────
const CREDIT_LIMITS = {
  free:    { monthly: 25  },
  pro:     { monthly: 150 },
  premium: { monthly: 500 },
};

// ── Source-level gates (predictions only — insights have no source gating) ─
const SOURCE_GATES = {
  free: {
    allow_watchlist_auto: false,
    allow_foryou_auto: false,
    allow_discovery_auto: false,
    allow_constrained: false,
    allow_repredict: true,
  },
  pro: {
    allow_watchlist_auto: true,
    allow_foryou_auto: true,
    allow_discovery_auto: true,
    allow_constrained: true,
    allow_repredict: true,
  },
  premium: {
    allow_watchlist_auto: true,
    allow_foryou_auto: true,
    allow_discovery_auto: true,
    allow_constrained: true,
    allow_repredict: true,
  },
};

// ── Company-funded sources ───────────────────────────────────────────────
// These sources cost the company but not the user. They are always allowed
// (bypass credit check) and never decrement the user's monthly budget.
// Analytics are still tracked under a separate event for cost attribution.
const COMPANY_FUNDED_SOURCES = new Set([
  'onboarding_seed',
]);

// ── Tier detection ────────────────────────────────────────────────────────
// Normalizes legacy and internal tier names into the product-facing ladder.

const TIER_ALIASES = {
  paid: 'pro',
  founder: 'premium',
};

function getSubscriptionTier() {
  // Founder allowlist → premium
  const email = (currentUser?.email || '').toLowerCase().trim();
  if (email && FOUNDER_EMAILS.includes(email)) return 'premium';

  // Explicit tier on user object, normalized through aliases
  const explicit = currentUser?.subscription_tier;
  if (explicit) {
    const normalized = TIER_ALIASES[explicit] || explicit;
    if (CREDIT_LIMITS[normalized]) return normalized;
  }

  return 'free';
}

export function getCreditPolicy() {
  const tier = getSubscriptionTier();
  return { ...CREDIT_LIMITS[tier], ...SOURCE_GATES[tier], tier };
}

// ── Credit tracking ──────────────────────────────────────────────────────
// Stored in localStorage as { month: "YYYY-MM", used: N }

const CREDIT_KEY = 'palatemap_credits';

function loadCredits() {
  try {
    const raw = localStorage.getItem(CREDIT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveCredits(credits) {
  localStorage.setItem(CREDIT_KEY, JSON.stringify(credits));
}

function monthStr() {
  return new Date().toISOString().slice(0, 7);
}

function getUsedThisMonth() {
  const credits = loadCredits() || {};
  const month = monthStr();
  return credits.month === month ? (credits.used || 0) : 0;
}

// ── Migration shim ───────────────────────────────────────────────────────
// Clean reset: removes old quota keys and starts fresh. Old usage under the
// previous (more generous) limits is not carried forward — the new credit
// system begins at zero to avoid retroactively penalizing existing users.

(function migrateOldQuotas() {
  const hadOldKeys = localStorage.getItem('palatemap_prediction_quota') || localStorage.getItem('palatemap_insight_quota');
  if (!hadOldKeys) return; // nothing to migrate
  localStorage.removeItem('palatemap_prediction_quota');
  localStorage.removeItem('palatemap_insight_quota');
  // Do not seed palatemap_credits — user starts fresh under the new system
})();

const PROXY_URL = 'https://palate-map-proxy.noahparikhcott.workers.dev';

// ── Server sync ─────────────────────────────────────────────────────────
// The server is the authoritative source of truth for credit usage.
// The local cache is updated from two paths:
// 1. Piggyback: every successful metered response includes _credits
// 2. Explicit: hydrateCreditsFromServer() on login/session start

/**
 * Update local credit cache from server-provided data.
 * Called when a metered API response includes _credits.
 */
export function syncCreditsFromResponse(creditsData) {
  if (!creditsData || creditsData.used == null) return;
  saveCredits({ month: monthStr(), used: creditsData.used });
}

/**
 * Fetch authoritative credit balance from server and update local cache.
 * Call on login, session restore, or when local state may be stale.
 */
export async function hydrateCreditsFromServer() {
  try {
    const { sb } = await import('./supabase.js');
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) return;

    const res = await fetch(`${PROXY_URL}/credits`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    });
    if (!res.ok) return;

    const data = await res.json();
    if (data.used != null) {
      saveCredits({ month: monthStr(), used: data.used });
    }
  } catch {
    // Non-critical — local cache continues to work as fallback
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Check if a credit can be used. For predictions, pass `source` for gate check.
 * For insights, omit source.
 * Returns { allowed, reason, companyFunded }.
 */
export function canUseCredit(source) {
  const policy = getCreditPolicy();

  // Company-funded sources are always allowed and never cost user credits
  if (source && COMPANY_FUNDED_SOURCES.has(source)) {
    return { allowed: true, reason: null, companyFunded: true };
  }

  // Source-level gating (predictions only)
  if (source) {
    const sourceGates = {
      watchlist_auto: policy.allow_watchlist_auto,
      foryou_auto: policy.allow_foryou_auto,
      discovery_auto: policy.allow_discovery_auto,
      constrained_search: policy.allow_constrained,
      repredict: policy.allow_repredict,
      manual_predict: true,
      manual_refresh: true,
    };

    if (sourceGates[source] === false) {
      return { allowed: false, reason: `${source} is not available on the ${policy.tier} plan.`, companyFunded: false };
    }
  }

  // Monthly credit check
  const used = getUsedThisMonth();
  if (used >= policy.monthly) {
    return { allowed: false, reason: `You've reached this month's ${policy.monthly} credit limit.`, companyFunded: false };
  }

  return { allowed: true, reason: null, companyFunded: false };
}

/**
 * Record a credit usage. Call after a successful API call.
 * Company-funded sources are tracked for analytics but do not decrement the user's budget.
 * @param {string} type - 'prediction' or 'insight'
 * @param {string|null} source - prediction source (null for insights)
 * @param {string|null} id - tmdbId or entity key
 */
export function recordCreditUsage(type, source, id) {
  const companyFunded = source && COMPANY_FUNDED_SOURCES.has(source);

  if (companyFunded) {
    track('credit_company_funded', {
      type,
      source,
      id: id || null,
      tier: getSubscriptionTier(),
    });
    return;
  }

  const credits = loadCredits() || {};
  const month = monthStr();
  if (credits.month !== month) { credits.month = month; credits.used = 0; }
  credits.used = (credits.used || 0) + 1;
  saveCredits(credits);

  track('credit_used', {
    type,
    source: source || null,
    id: id || null,
    monthly_used: credits.used,
    tier: getSubscriptionTier(),
  });
}

/**
 * Get remaining credits for display.
 */
export function getRemainingCredits() {
  const policy = getCreditPolicy();
  const used = getUsedThisMonth();
  return {
    remaining: Math.max(0, policy.monthly - used),
    limit: policy.monthly,
    tier: policy.tier,
  };
}

// ── Onboarding seed grace ─────────────────────────────────────────────────

export function isOnboardingSeedEligible() {
  if (!currentUser) return false;
  if (currentUser.onboarding_discover_seeded) return false;
  if (!currentUser.archetype) return false;
  return true;
}

export function markOnboardingSeeded() {
  return {
    onboarding_discover_seeded: true,
    onboarding_discover_seeded_at: new Date().toISOString(),
  };
}

/**
 * Check if a prediction for this film is cached.
 */
export function isCachedPrediction(tmdbId) {
  return !!currentUser?.predictions?.[String(tmdbId)];
}

/**
 * Simple 30-day cache validity check.
 */
export function isCacheValid(tmdbId) {
  const entry = currentUser?.predictions?.[String(tmdbId)];
  if (!entry?.predictedAt) return false;
  const age = Date.now() - new Date(entry.predictedAt).getTime();
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
  return age < THIRTY_DAYS;
}
