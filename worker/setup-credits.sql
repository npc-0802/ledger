-- ── Credit Usage Table ─────────────────────────────────────────────────────
-- Unified server-side credit tracking. Replaces prediction_quota with a single
-- table that covers predictions AND insights under one monthly budget.
--
-- Migration: run this AFTER setup.sql. The old prediction_quota table is kept
-- for historical reference but no longer written to by the Worker.

CREATE TABLE IF NOT EXISTS credit_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date_bucket date NOT NULL DEFAULT CURRENT_DATE,
  credit_type text NOT NULL,      -- 'prediction' or 'insight'
  source text,                     -- prediction source or null for insights
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One row per user + day + type + source
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_user_date_type_source
  ON credit_usage(user_id, date_bucket, credit_type, COALESCE(source, ''));

-- For monthly aggregation queries
CREATE INDEX IF NOT EXISTS idx_credit_user_month
  ON credit_usage(user_id, date_bucket);

-- ── Credit Reservations ─────────────────────────────────────────────────
-- Pending reservations count toward the monthly cap to prevent overspend.
-- Flow: reserve (pending) → finalize (on API success) or release (on failure).
-- Stale pending reservations (>5 min) are ignored in budget checks to handle
-- Worker crashes or timeouts gracefully.

CREATE TABLE IF NOT EXISTS credit_reservations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  credit_type text NOT NULL,
  source text,
  status text NOT NULL DEFAULT 'pending',   -- 'pending', 'finalized', 'released'
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_cres_user_pending
  ON credit_reservations(user_id, status, created_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_cres_user_month
  ON credit_reservations(user_id, created_at)
  WHERE status = 'finalized';

-- ── Reserve credit (atomic, pre-call) ───────────────────────────────────
-- Checks monthly total (finalized usage + live pending reservations) against
-- the limit. If under cap, creates a pending reservation and returns its ID.
-- Advisory-locked per user to prevent concurrent overspend.
--
-- Returns: { "allowed": bool, "reservation_id": uuid|null, "monthly_used": N,
--            "pending": N, "reason": text|null }

CREATE OR REPLACE FUNCTION reserve_credit(
  p_user_id uuid,
  p_monthly_limit integer,
  p_credit_type text,
  p_source text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_finalized integer;
  v_pending integer;
  v_total integer;
  v_month text;
  v_lock_key bigint;
  v_res_id uuid;
  v_cutoff timestamptz;
BEGIN
  -- Advisory lock per user
  v_lock_key := ('x' || left(replace(p_user_id::text, '-', ''), 15))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  v_month := to_char(CURRENT_DATE, 'YYYY-MM');
  v_cutoff := now() - interval '5 minutes';

  -- Finalized usage this month (from credit_usage)
  SELECT COALESCE(SUM(count), 0) INTO v_finalized
    FROM credit_usage
    WHERE user_id = p_user_id
      AND to_char(date_bucket, 'YYYY-MM') = v_month;

  -- Live pending reservations (not expired)
  SELECT COUNT(*) INTO v_pending
    FROM credit_reservations
    WHERE user_id = p_user_id
      AND status = 'pending'
      AND created_at > v_cutoff
      AND to_char(created_at, 'YYYY-MM') = v_month;

  v_total := v_finalized + v_pending;

  IF v_total >= p_monthly_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reservation_id', null,
      'monthly_used', v_finalized,
      'pending', v_pending,
      'reason', 'monthly_limit'
    );
  END IF;

  -- Create pending reservation
  INSERT INTO credit_reservations (user_id, credit_type, source)
  VALUES (p_user_id, p_credit_type, p_source)
  RETURNING id INTO v_res_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'reservation_id', v_res_id,
    'monthly_used', v_finalized,
    'pending', v_pending + 1,
    'reason', null
  );
END;
$$;

-- ── Finalize credit (post-success) ──────────────────────────────────────
-- Marks a pending reservation as finalized and increments credit_usage.
-- Returns: { "monthly_used": N }

CREATE OR REPLACE FUNCTION finalize_credit(
  p_reservation_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_monthly integer;
  v_month text;
  v_lock_key bigint;
  v_res record;
BEGIN
  -- Advisory lock per user
  v_lock_key := ('x' || left(replace(p_user_id::text, '-', ''), 15))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Mark reservation as finalized
  UPDATE credit_reservations
  SET status = 'finalized', resolved_at = now()
  WHERE id = p_reservation_id AND user_id = p_user_id AND status = 'pending'
  RETURNING credit_type, source INTO v_res;

  -- If reservation was already resolved (duplicate finalize), just return current total
  IF v_res IS NULL THEN
    v_month := to_char(CURRENT_DATE, 'YYYY-MM');
    SELECT COALESCE(SUM(count), 0) INTO v_monthly
      FROM credit_usage
      WHERE user_id = p_user_id
        AND to_char(date_bucket, 'YYYY-MM') = v_month;
    RETURN jsonb_build_object('monthly_used', v_monthly);
  END IF;

  -- Increment credit_usage
  INSERT INTO credit_usage (user_id, date_bucket, credit_type, source, count, updated_at)
  VALUES (p_user_id, CURRENT_DATE, v_res.credit_type, v_res.source, 1, now())
  ON CONFLICT (user_id, date_bucket, credit_type, COALESCE(source, ''))
  DO UPDATE SET
    count = credit_usage.count + 1,
    updated_at = now();

  -- Return new monthly total
  v_month := to_char(CURRENT_DATE, 'YYYY-MM');
  SELECT COALESCE(SUM(count), 0) INTO v_monthly
    FROM credit_usage
    WHERE user_id = p_user_id
      AND to_char(date_bucket, 'YYYY-MM') = v_month;

  RETURN jsonb_build_object('monthly_used', v_monthly);
END;
$$;

-- ── Release credit (post-failure) ───────────────────────────────────────
-- Marks a pending reservation as released. The slot becomes available again.

CREATE OR REPLACE FUNCTION release_credit(
  p_reservation_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE credit_reservations
  SET status = 'released', resolved_at = now()
  WHERE id = p_reservation_id AND user_id = p_user_id AND status = 'pending';
END;
$$;

-- ── Check budget (read-only, for GET /credits) ──────────────────────────
-- Returns current monthly usage (finalized only) for display.

CREATE OR REPLACE FUNCTION check_credit_budget(
  p_user_id uuid,
  p_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_monthly integer;
  v_month text;
BEGIN
  v_month := to_char(p_date, 'YYYY-MM');
  SELECT COALESCE(SUM(count), 0) INTO v_monthly
    FROM credit_usage
    WHERE user_id = p_user_id
      AND to_char(date_bucket, 'YYYY-MM') = v_month;

  RETURN jsonb_build_object('monthly_used', v_monthly);
END;
$$;

-- Drop old functions from previous iterations
DROP FUNCTION IF EXISTS record_credit(uuid, date, text, text);

-- ── RLS (allow service role only) ─────────────────────────────────────────
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON credit_usage;
CREATE POLICY "service_role_all" ON credit_usage
  FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_role_all" ON credit_reservations;
CREATE POLICY "service_role_all" ON credit_reservations
  FOR ALL
  USING (auth.role() = 'service_role');
