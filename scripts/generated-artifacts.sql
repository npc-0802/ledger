-- ── Generated Artifacts ──────────────────────────────────────────────────────
-- Server-side persistence for all Claude-generated content.
-- Users own their generated artifacts — reopening is always free.
--
-- Run this in the Supabase SQL Editor.

CREATE TABLE generated_artifacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  content_type text NOT NULL,        -- 'film_prediction', 'entity_insight', 'film_insight'
  object_type text NOT NULL,         -- 'film', 'entity'
  object_id text NOT NULL,           -- tmdb id, 'director::christopher nolan', etc.
  object_label text,                 -- human-readable label for debugging
  payload jsonb NOT NULL,            -- full generated artifact
  summary_text text,                 -- optional denormalized display text
  model text,                        -- e.g. 'claude-sonnet-4-20250514'
  generation_source text,            -- e.g. 'manual_predict', 'discover_seed'
  generated_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  stale_after timestamptz,           -- optional time-based invalidation
  version integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- One current artifact per user/type/object
CREATE UNIQUE INDEX idx_artifacts_unique
  ON generated_artifacts(user_id, content_type, object_id);

-- User's artifacts by recency
CREATE INDEX idx_artifacts_user_recent
  ON generated_artifacts(user_id, generated_at DESC);

-- Lookup by content type + object
CREATE INDEX idx_artifacts_type_object
  ON generated_artifacts(content_type, object_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE generated_artifacts ENABLE ROW LEVEL SECURITY;

-- Users can read their own artifacts
CREATE POLICY "Users can read own artifacts"
  ON generated_artifacts FOR SELECT
  USING (user_id IN (
    SELECT id FROM palatemap_users WHERE auth_id = auth.uid()
  ));

-- Users can insert their own artifacts
CREATE POLICY "Users can insert own artifacts"
  ON generated_artifacts FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM palatemap_users WHERE auth_id = auth.uid()
  ));

-- Users can update their own artifacts
CREATE POLICY "Users can update own artifacts"
  ON generated_artifacts FOR UPDATE
  USING (user_id IN (
    SELECT id FROM palatemap_users WHERE auth_id = auth.uid()
  ));
