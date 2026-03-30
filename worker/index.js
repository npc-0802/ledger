// ── Palate Map Proxy Worker ────────────────────────────────────────────────
// Cloudflare Worker that proxies Anthropic API calls and Resend emails.
// Server-side credit enforcement prevents client-side bypass.
//
// Credit flow: reserve slot → call Anthropic → finalize or release.
// Pending reservations count toward the cap (no concurrent overspend).
// Failed API calls release the reservation (no charge to user).
//
// Company-funded sources bypass credit checks but still log usage.
//
// Environment variables (set in Cloudflare dashboard):
//   ANTHROPIC_KEY     — Anthropic API key
//   RESEND_API_KEY    — Resend email API key
//   SUPABASE_URL      — Supabase project URL
//   SUPABASE_KEY      — Supabase service role key (for server-side DB access)

// ── Tier definitions (must match client-side credit-policy.js) ───────────

const CREDIT_LIMITS = {
  free:    { monthly: 25  },
  pro:     { monthly: 150 },
  premium: { monthly: 500 },
};

// Source-level gating by tier (predictions only)
const SOURCE_GATES = {
  free: {
    manual_predict: true,
    repredict: true,
    manual_refresh: true,
    overlap_predict: true,
    watchlist_auto: false,
    foryou_auto: false,
    discovery_auto: false,
    constrained_search: false,
  },
  pro: {
    manual_predict: true,
    repredict: true,
    manual_refresh: true,
    overlap_predict: true,
    watchlist_auto: true,
    foryou_auto: true,
    discovery_auto: true,
    constrained_search: true,
  },
  premium: {
    manual_predict: true,
    repredict: true,
    manual_refresh: true,
    overlap_predict: true,
    watchlist_auto: true,
    foryou_auto: true,
    discovery_auto: true,
    constrained_search: true,
  },
};

// Company-funded sources: allowed without credit check, never charged to user
const COMPANY_FUNDED_SOURCES = new Set([
  'onboarding_seed',
]);

// Founder emails → premium tier (case-insensitive)
const FOUNDER_EMAILS = [
  'noahparikhcott@gmail.com',
];

// Legacy tier aliases → normalized product-facing names
const TIER_ALIASES = {
  paid: 'pro',
  founder: 'premium',
};

// ── CORS ──────────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function corsResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// ── Supabase helpers ──────────────────────────────────────────────────────

async function supabaseQuery(env, path, options = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    'apikey': env.SUPABASE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=minimal',
  };
  return fetch(url, { method: options.method || 'GET', headers, body: options.body });
}

// Verify a Supabase JWT and extract user info
async function verifySupabaseAuth(env, accessToken) {
  if (!accessToken) return null;
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': env.SUPABASE_KEY,
      },
    });
    if (!res.ok) return null;
    const user = await res.json();
    return { id: user.id, email: (user.email || '').toLowerCase().trim() };
  } catch {
    return null;
  }
}

// Look up and normalize user tier
async function getUserTier(env, authUser) {
  if (!authUser) return 'free';

  // Founder email check → premium
  if (authUser.email && FOUNDER_EMAILS.includes(authUser.email)) return 'premium';

  // Check subscription_tier in palatemap_users, normalize through aliases
  try {
    const res = await supabaseQuery(env, `palatemap_users?auth_id=eq.${authUser.id}&select=subscription_tier`);
    if (res.ok) {
      const rows = await res.json();
      if (rows.length > 0 && rows[0].subscription_tier) {
        const raw = rows[0].subscription_tier;
        const normalized = TIER_ALIASES[raw] || raw;
        if (CREDIT_LIMITS[normalized]) return normalized;
      }
    }
  } catch {}

  return 'free';
}

// ── Credit enforcement ──────────────────────────────────────────────────
// Three-phase atomic flow:
//   1. reserve_credit  — atomically checks (finalized + pending) against cap,
//                        creates a pending reservation if under limit
//   2. call Anthropic
//   3a. finalize_credit — on success: marks reservation finalized, increments usage
//   3b. release_credit  — on failure: marks reservation released, slot freed
//
// Pending reservations count toward the cap, so concurrent requests cannot
// overspend. Stale reservations (>5 min) are auto-ignored in budget checks.

// Read-only budget check (for GET /credits display endpoint only).
async function checkBudget(env, userId) {
  try {
    const res = await supabaseQuery(env, 'rpc/check_credit_budget', {
      method: 'POST',
      prefer: 'return=representation',
      body: JSON.stringify({ p_user_id: userId, p_date: new Date().toISOString().slice(0, 10) }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// Atomically reserve a credit slot. Returns { allowed, reservation_id, ... }.
async function reserveCredit(env, userId, tier, creditType, source) {
  const limits = CREDIT_LIMITS[tier] || CREDIT_LIMITS.free;
  try {
    const res = await supabaseQuery(env, 'rpc/reserve_credit', {
      method: 'POST',
      prefer: 'return=representation',
      body: JSON.stringify({
        p_user_id: userId,
        p_monthly_limit: limits.monthly,
        p_credit_type: creditType,
        p_source: source || null,
      }),
    });
    if (!res.ok) {
      console.error('reserve_credit RPC failed:', res.status, await res.text());
      return { allowed: false, reason: 'quota_service_error' };
    }
    return await res.json();
  } catch (e) {
    console.error('reserveCredit error:', e);
    return { allowed: false, reason: 'quota_service_error' };
  }
}

// Finalize a reservation after successful API call. Returns { monthly_used }.
async function finalizeCredit(env, reservationId, userId) {
  try {
    const res = await supabaseQuery(env, 'rpc/finalize_credit', {
      method: 'POST',
      prefer: 'return=representation',
      body: JSON.stringify({ p_reservation_id: reservationId, p_user_id: userId }),
    });
    if (!res.ok) {
      console.error('finalize_credit RPC failed:', res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error('finalizeCredit error:', e);
    return null;
  }
}

// Release a reservation after failed API call. Frees the slot.
async function releaseCredit(env, reservationId, userId) {
  try {
    await supabaseQuery(env, 'rpc/release_credit', {
      method: 'POST',
      body: JSON.stringify({ p_reservation_id: reservationId, p_user_id: userId }),
    });
  } catch (e) {
    console.error('releaseCredit error:', e);
  }
}

// Full pre-call gate: source gating + atomic reservation.
// Returns { allowed, reservationId?, companyFunded?, error?, message? }
async function reserveCreditSlot(env, authUser, tier, creditType, source) {
  // Company-funded sources bypass credit checks entirely
  if (source && COMPANY_FUNDED_SOURCES.has(source)) {
    return { allowed: true, companyFunded: true };
  }

  // Source gating (predictions only — no DB call needed)
  if (source) {
    const gates = SOURCE_GATES[tier] || SOURCE_GATES.free;
    if (gates[source] === false) {
      return {
        allowed: false,
        error: 'plan_restricted',
        message: `${source} is not available on the ${tier} plan.`,
      };
    }
  }

  // Atomic reservation (includes budget check)
  const result = await reserveCredit(env, authUser.id, tier, creditType, source);

  if (!result.allowed) {
    // Attach _credits so the client can refresh its local display cache
    // even on denied requests — prevents stale balance after exhaustion.
    const creditsPayload = result.monthly_used != null
      ? { used: result.monthly_used + (result.pending || 0) }
      : undefined;

    if (result.reason === 'monthly_limit') {
      const limits = CREDIT_LIMITS[tier] || CREDIT_LIMITS.free;
      return {
        allowed: false,
        error: 'quota_exceeded',
        message: `You've reached this month's ${limits.monthly} credit limit.`,
        _credits: creditsPayload,
      };
    }
    return {
      allowed: false,
      error: 'quota_service_error',
      message: 'Unable to verify credit budget. Please try again.',
      _credits: creditsPayload,
    };
  }

  return { allowed: true, reservationId: result.reservation_id, companyFunded: false };
}

// ── Email actions ─────────────────────────────────────────────────────────

async function handleEmailAction(env, body) {
  if (body.action === 'send_invite') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Palate Map <noreply@palatemap.com>',
        to: body.to,
        subject: `${body.from_name} invited you to Palate Map`,
        html: `<p>${body.from_name} thinks you'd enjoy Palate Map — a taste intelligence platform that maps how you experience film.</p><p><a href="${body.invite_link}">Join here</a></p>`,
      }),
    });
    return corsResponse({ ok: res.ok });
  }

  if (body.action === 'friend_request_notification') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Palate Map <noreply@palatemap.com>',
        to: body.to,
        subject: `${body.from_name} wants to connect on Palate Map`,
        html: `<p>${body.from_name}${body.from_archetype ? ` (${body.from_archetype})` : ''} sent you a friend request on Palate Map.</p><p><a href="https://palatemap.com">Open Palate Map</a></p>`,
      }),
    });
    return corsResponse({ ok: res.ok });
  }

  return corsResponse({ error: 'unknown_action' }, 400);
}

// ── Claude proxy ──────────────────────────────────────────────────────────

async function callAnthropic(env, body) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: body.model || 'claude-sonnet-4-20250514',
      max_tokens: body.max_tokens || 1024,
      system: body.system || undefined,
      messages: body.messages,
    }),
  });
  return { data: await res.json(), status: res.status, ok: res.ok };
}

// ── Auth helper ─────────────────────────────────────────────────────────

function extractAccessToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

// ── Credit balance endpoint ─────────────────────────────────────────────
// GET /credits — returns the user's current credit balance from the server.
// Used by the client to hydrate the display cache from the authoritative ledger.

async function handleCreditBalance(env, request) {
  const accessToken = extractAccessToken(request);
  const authUser = await verifySupabaseAuth(env, accessToken);
  if (!authUser) {
    return corsResponse({ error: 'auth_required' }, 401);
  }

  const tier = await getUserTier(env, authUser);
  const limits = CREDIT_LIMITS[tier] || CREDIT_LIMITS.free;
  const budget = await checkBudget(env, authUser.id);

  if (!budget) {
    return corsResponse({ error: 'service_error' }, 500);
  }

  return corsResponse({
    used: budget.monthly_used,
    limit: limits.monthly,
    remaining: Math.max(0, limits.monthly - budget.monthly_used),
    tier,
  });
}

// ── Main handler ──────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Credit balance endpoint (GET)
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/credits') {
      return handleCreditBalance(env, request);
    }

    if (request.method !== 'POST') {
      return corsResponse({ error: 'method_not_allowed' }, 405);
    }

    const body = await request.json();

    // Route email actions (no credits needed)
    if (body.action) {
      return handleEmailAction(env, body);
    }

    // Claude API call
    if (body.messages) {
      // Determine credit type: prediction_source → prediction, credit_source → insight
      const creditType = body.prediction_source ? 'prediction'
                       : body.credit_source     ? 'insight'
                       : null;
      const source = body.prediction_source || body.credit_source || null;

      // Non-metered calls pass through freely (no prediction_source or credit_source)
      if (!creditType) {
        const result = await callAnthropic(env, body);
        return corsResponse(result.data, result.status);
      }

      // Metered calls REQUIRE authentication
      const accessToken = extractAccessToken(request);
      const authUser = await verifySupabaseAuth(env, accessToken);

      if (!authUser) {
        return corsResponse({
          error: 'auth_required',
          message: 'Authentication required. Please sign in.',
        }, 401);
      }

      const tier = await getUserTier(env, authUser);

      // Phase 1: Atomic reservation (checks budget + creates pending slot)
      const reservation = await reserveCreditSlot(env, authUser, tier, creditType, source);
      if (!reservation.allowed) {
        return corsResponse({
          error: reservation.error,
          message: reservation.message,
          // Include _credits so the client can refresh its stale local cache
          ...(reservation._credits ? { _credits: reservation._credits } : {}),
        }, 429);
      }

      // Phase 2: Call Anthropic (slot is reserved, concurrent requests see it)
      const apiResult = await callAnthropic(env, body);

      // Phase 3: Finalize on success, release on failure
      if (!reservation.companyFunded && reservation.reservationId) {
        if (apiResult.ok) {
          // Finalize: mark reservation done, increment credit_usage
          const finalized = await finalizeCredit(env, reservation.reservationId, authUser.id);
          if (finalized) {
            const limits = CREDIT_LIMITS[tier] || CREDIT_LIMITS.free;
            apiResult.data._credits = {
              used: finalized.monthly_used,
              limit: limits.monthly,
              remaining: Math.max(0, limits.monthly - finalized.monthly_used),
              tier,
            };
          }
        } else {
          // Release: free the slot — user keeps their budget
          await releaseCredit(env, reservation.reservationId, authUser.id);
        }
      }

      return corsResponse(apiResult.data, apiResult.ok ? 200 : apiResult.status);
    }

    return corsResponse({ error: 'invalid_request' }, 400);
  },
};
