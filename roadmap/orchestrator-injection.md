# Inject into every sprint brief

Two blocks to paste verbatim at the **end of every sprint brief** (before the brief's own success criteria). They convert "trust the orchestrator" into "trust the orchestrator + observable safety net."

---

## Block A — Test gate (mandatory, before sprint close)

A sprint is not closed until **all** of the following succeed in the exact order shown. If any step fails, the orchestrator must surface a blocker; it must NOT mark the sprint complete and proceed.

```bash
# 1. Production build must be clean
npx vite build
# expect: "✓ built in ..." with no errors. Warnings about chunk size are fine.

# 2. All node unit suites (one command, all must pass)
for t in film-scorer analog-selector curation-parse non-latin-filter book-queries taste-summary credentials; do
  node tests/$t.test.mjs || { echo "❌ $t failed"; exit 1; }
done

# 3. Playwright — runs ALL specs in tests/ so new specs added in-sprint are
#    picked up without editing this gate.
lsof -ti:5173 | xargs kill -9 2>/dev/null; sleep 1
npx playwright test --reporter=line
# expect: all tests passed (0 failed).
# Currently in repo: books-discover, navigation, add-film, cold-landing,
# onboarding, onboarding-autosave, onboarding-math, starters, smart-search,
# beta-attribution. The orchestrator should NOT skip suites just because they
# weren't touched in the sprint — regressions there are still regressions.

# 4. Dev server boots cleanly (trap ensures we kill it even on early-exit)
npm run dev &
DEV_PID=$!
trap 'kill "$DEV_PID" 2>/dev/null || true' EXIT
sleep 3
curl -fs http://localhost:5173/ > /dev/null && echo "✓ dev server up" || { echo "❌ dev server down"; exit 1; }
# expect: ✓ dev server up. EXIT trap kills the dev server cleanly on any exit
# path so the next sprint starts with port 5173 free.
```

If the sprint added new pure helpers, **a new node test suite must accompany them.** If the sprint added new UI surfaces, **at least one Playwright assertion must cover the new path.** Both: "verify it works" gates, not "100% coverage" goals.

After the sprint closes, kill stray dev servers (`lsof -ti:5173 | xargs kill -9`) so the next sprint starts clean.

---

## Block B — Project-specific gotchas the orchestrator can't infer

Treat each of these as a constraint, not a suggestion. Several have already cost the project hours of confused work; codifying them prevents replays.

### Gotcha 1 · `palatemap_users` JSONB rigidity

The Supabase `palatemap_users` table has specific columns. Adding a **new key** to the `syncToSupabase` upsert payload that doesn't correspond to an existing column makes PostgREST reject the **entire row**, breaking sync for the user.

- **DO:** put new per-user persistable state inside an existing JSONB column (typically inside the `watchlist` array, the `predictions` map, or another existing field).
- **DO:** keep transient/local-only state in `localStorage` and hydrate it from `prev.<field>` in `src/modules/supabase.js _applyUserData` so it survives in-session reloads.
- **DO NOT:** add `book_predictions`, `book_shelves`, `reading_progress`, or any sibling top-level key to the payload object in `syncToSupabase`.

Cross-device persistence for paid content goes through the `generated_artifacts` table — that table has a generic `content_type` / `object_type` / `object_id` shape that accepts new artifact kinds without schema migration. Reuse the pattern in `book-predict.saveGeneratedArtifact` / `book-recommender.tryServerCuratedShelf`.

### Gotcha 2 · Worker source-gate defaults to ALLOWED for unknown sources

The Cloudflare Worker (`worker/index.js`) rejects a `prediction_source` only when `SOURCE_GATES[tier][source] === false`. Unknown (undefined) sources fall through to the budget check and **meter normally**. This means:

- Adding a new metered prediction source (e.g., `book_rate_predict`) **does not require redeploying the Worker** for it to function — adding the source to the SOURCE_GATES tables is for explicitness, not gating.
- Adding the source to the client-side `canUseSource` table in `credit-policy.js` IS required, otherwise the client may not gate correctly. Be precise about which side of the wire needs the change.

### Gotcha 3 · Server credit finalizes BEFORE client parse

Every metered Anthropic call finalizes the credit reservation in the Worker as soon as the API call returns OK. If the client then fails to parse the response, **the user has been charged**. New metered flows must therefore:

- Use the salvage-capable parser pattern (`src/modules/books/curation-parse.js`) — fence stripping, balanced-object extraction, trailing-comma repair, shape normalization.
- Capture raw output on parse failure (`console.warn` + `window.__<feature>Error` + `track('<feature>_parse_failed', ...)`).
- Surface a user-friendly toast (NOT developer error text).
- If possible, fall through to a still-usable degraded state (see Sprint 1 punch-list item 2 for the curation example).

### Gotcha 4 · `medium` backfill runs every pass

`runMigrations` (in `src/modules/storage.js`) backfills `medium:'film'` on un-tagged `MOVIES` items and watchlist entries on **every** call (no flag), because Supabase loads can overwrite locally-migrated data. Any code that reads `m.medium` must continue to defend with `m.medium || 'film'`. Don't assume `medium` is always present at the moment of read for items that just came off the wire.

### Gotcha 5 · `MOVIES` is the universal rated-items array

Despite the legacy name, `MOVIES` is the array for **all rated items across mediums** going forward (films and, in Sprint 3 onward, rated books). Helpers that need to filter by medium use `m.medium || 'film'`. Do NOT introduce a parallel `BOOKS` array (locked decision in `pre-sprint-decisions.md`).

### Gotcha 6 · Sync guard prevents stale-client overwrites

`syncToSupabase` checks the server's `movies.length` first; if the server has more rated items than the local array, it refuses to overwrite to prevent stale-client data loss. New persistence work should NOT bypass this guard.

### Gotcha 7 · Prediction map trims to 200

`currentUser.predictions` and `currentUser.bookPredictions` are trimmed to the 200 most recent entries on each write. For new prediction kinds, follow the same trim pattern (see `book-predict.trimBookPredictions`).

### Gotcha 8 · Recommendation caches are per-fingerprint

The books shelf cache is fingerprint-keyed (`palatemap_book_shelf_v2`) and includes mood in the fingerprint. Film recommendation caches use a simpler structure (single `cachedRecommendations` + `cachedUpsideRecommendations`). New per-medium caches should follow the books fingerprint pattern if they're per-context, the film pattern if they're per-user.

### Gotcha 9 · Test fixtures are 12 specific films

`tests/fixtures.js` injects 12 specific films into `MOVIES` for Playwright runs. Several of those films (Parasite, Moonlight, EEAAO, Whiplash, etc.) carry awards in the credentials data. **Don't assume the fixture mirrors a real user's profile.** Tests that depend on specific titles being present should reference the fixture list explicitly.

### Gotcha 10 · The Worker proxy is shared across all Anthropic calls

`PROXY_URL = 'https://palate-map-proxy.noahparikhcott.workers.dev'` handles every Claude call. New metered flows go through it. The `credit_source` vs `prediction_source` distinction matters: `prediction_source` triggers per-item gating logic; `credit_source` is treated as an insight-style metered call. Pick the one that matches the product semantics.

---

## How to use these blocks

For every sprint brief you (or Codex) write:

1. Paste **Block A** at the bottom of the brief's "Success criteria" section.
2. Paste **Block B** as a "Project constraints" section near the top.
3. Add a "Pre-decided architectural points" reference: *"See `roadmap/pre-sprint-decisions.md`. Do not re-litigate those decisions; block on anything outside that table."*

This converts a roadmap into something an orchestrator can execute against safely while the operator is on a phone.
