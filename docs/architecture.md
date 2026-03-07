# Architecture

## Purpose
`canon` is a taste intelligence app that starts with film scoring and analysis, then expands into other creative domains.

## Runtime Architecture
- Frontend: Vite + vanilla JavaScript (ES modules)
- State: in-app shared state via `src/state.js`
- Data: baseline movie/archetype/category data under `src/data/`
- UI logic: feature modules under `src/modules/`
- Styling: `src/styles/main.css` + `src/styles/components.css`
- Persistence:
  - Local: localStorage helpers in `src/modules/storage.js`
  - Cloud: Supabase sync via `src/modules/supabase.js`
- AI prediction: frontend calls Cloudflare Worker proxy, which calls Anthropic API

## Repository Map
- `index.html`: app shell
- `src/main.js`: entry point, bootstrapping, view init
- `src/state.js`: global app state and constants
- `src/data/`: baseline data sets
- `src/modules/`: feature modules (rankings, modal, onboarding, predict, explore, calibrate, analysis, profile)
- `src/styles/`: global and component styles
- `docs/`: static deploy output and project docs

## Data Model (Current)
Primary table: `ledger_users` (planned rename to `canon_users`)
- `id` (uuid, pk)
- `username` (text, unique)
- `display_name` (text)
- `archetype` / `archetype_secondary` (text)
- `weights` (jsonb)
- `harmony_sensitivity` (numeric)
- `movies` (jsonb array of film objects)
- `created_at`, `updated_at` (timestamp)

Film object shape:
- metadata: `title`, `year`, `director`, `writer`, `cast`, `productionCompanies`, `poster`, `overview`
- scoring: `scores` object with 8 categories + `total`

## Scoring Formula
`total = Σ(score[cat] * weight[cat]) / Σ(weight[cat])`

On any weight update, recalculate all totals before persist/sync.

## External Integrations
- Supabase project for profile + movie persistence
- TMDB for film metadata enrichment
- Cloudflare Worker proxy for Anthropic access (API key stays server-side)

## Known Technical Debt
- Incomplete baseline production company backfill
- Limited user-facing sync error handling
- No test suite yet
- Legacy naming (`ledger_*`) pending migration to `canon_*`

## Near-Term Architecture Priorities
1. Add reliable sync/error surfaces.
2. Complete naming migration (`ledger` -> `canon`) in storage + Supabase.
3. Complete git remote alignment to canonical repo `npc-0802/palatemap`.
4. Reassess React only when real-time friend/social state complexity justifies it.
