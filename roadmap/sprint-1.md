# Sprint 1 — Books Polish + Stability (assembled brief, paste-ready)

> This is the **single artifact** the orchestrator runs against for Sprint 1 of the Palate Map Books roadmap. The component pieces it was assembled from live in the same directory (`sprint-1-punchlist.md`, `pre-sprint-decisions.md`, `orchestrator-injection.md`) — those remain the source of truth; this file is the merged operator-facing form.

---

## 0 · How to use this brief

You are an autonomous orchestrator working on a Palate Map sprint. The operator may be away from the laptop and will respond to blockers from a phone (the operator console + Tailscale URL). Optimize for phone-friendly blocker resolution: keep questions small, recommend an answer first, and resume the moment they're answered.

- **Repo root:** `/Users/noahcott/palatemap`
- **Active branch:** `main` (do not switch unless explicitly told to)
- **Mode:** complete this sprint and stop. Do NOT advance to Sprint 2 unattended.
- **Test gate (Block A in `§4`) is hard-enforced.** A sprint is NOT closed until every step in the test gate is green.

---

## 1 · Project constraints (read before doing anything)

Treat each of these as a hard constraint, not a suggestion. Several have already cost the project hours of confused work; codifying them prevents replays.

### Gotcha 1 · `palatemap_users` JSONB rigidity

The Supabase `palatemap_users` table has specific columns. Adding a **new key** to the `syncToSupabase` upsert payload that doesn't correspond to an existing column makes PostgREST reject the **entire row**, breaking sync for the user.

- **DO:** put new per-user persistable state inside an existing JSONB column (typically inside the `watchlist` array, the `predictions` map, or another existing field).
- **DO:** keep transient/local-only state in `localStorage` and hydrate it from `prev.<field>` in `src/modules/supabase.js _applyUserData` so it survives in-session reloads.
- **DO NOT:** add `book_predictions`, `book_shelves`, `reading_progress`, or any sibling top-level key to the payload object in `syncToSupabase`.

Cross-device persistence for paid content goes through the `generated_artifacts` table — that table has a generic `content_type` / `object_type` / `object_id` shape that accepts new artifact kinds without schema migration. Reuse the pattern in `book-predict.saveGeneratedArtifact` / `book-recommender.tryServerCuratedShelf`.

### Gotcha 2 · Worker source-gate defaults to ALLOWED for unknown sources

The Cloudflare Worker (`worker/index.js`) rejects a `prediction_source` only when `SOURCE_GATES[tier][source] === false`. Unknown (undefined) sources fall through to the budget check and **meter normally**. Adding a new metered source to the SOURCE_GATES tables is for explicitness, not gating. Adding the source to the client-side `canUseSource` table in `credit-policy.js` IS required, otherwise the client may not gate correctly.

### Gotcha 3 · Server credit finalizes BEFORE client parse

Every metered Anthropic call finalizes the credit reservation in the Worker as soon as the API call returns OK. If the client then fails to parse the response, **the user has been charged**. New metered flows must:

- Use the salvage-capable parser pattern (`src/modules/books/curation-parse.js`).
- Capture raw output on parse failure (`console.warn` + `window.__<feature>Error` + `track('<feature>_parse_failed', ...)`).
- Surface a user-friendly toast (NOT developer error text).
- Where possible, fall through to a still-usable degraded state (see Sprint 1 punch-list item 2 for the curation example).

### Gotcha 4 · `medium` backfill runs every pass

`runMigrations` (in `src/modules/storage.js`) backfills `medium:'film'` on un-tagged `MOVIES` items and watchlist entries on **every** call (no flag), because Supabase loads can overwrite locally-migrated data. Any code that reads `m.medium` must defend with `m.medium || 'film'`.

### Gotcha 5 · `MOVIES` is the universal rated-items array

Despite the legacy name, `MOVIES` is the array for **all rated items across mediums** (films and, in Sprint 3 onward, rated books). Helpers that need to filter by medium use `m.medium || 'film'`. Do NOT introduce a parallel `BOOKS` array (locked in `pre-sprint-decisions.md`).

### Gotcha 6 · Sync guard prevents stale-client overwrites

`syncToSupabase` checks the server's `movies.length` first; if the server has more rated items than the local array, it refuses to overwrite to prevent stale-client data loss. New persistence work should NOT bypass this guard.

### Gotcha 7 · Prediction map trims to 200

`currentUser.predictions` and `currentUser.bookPredictions` are trimmed to the 200 most recent entries on each write. For new prediction kinds, follow the same trim pattern (see `book-predict.trimBookPredictions`).

### Gotcha 8 · Recommendation caches are per-fingerprint

The books shelf cache is fingerprint-keyed (`palatemap_book_shelf_v2`) and includes mood in the fingerprint. Film recommendation caches use a simpler structure (single `cachedRecommendations` + `cachedUpsideRecommendations`). New per-medium caches should follow the books fingerprint pattern if they're per-context, the film pattern if they're per-user.

### Gotcha 9 · Test fixtures are 12 specific films

`tests/fixtures.js` injects 12 specific films into `MOVIES` for Playwright runs. Several of those films (Parasite, Moonlight, EEAAO, Whiplash, etc.) carry awards in the credentials data. Don't assume the fixture mirrors a real user's profile. Tests that depend on specific titles being present should reference the fixture list explicitly.

### Gotcha 10 · The Worker proxy is shared across all Anthropic calls

`PROXY_URL = 'https://palate-map-proxy.noahparikhcott.workers.dev'` handles every Claude call. The `credit_source` vs `prediction_source` distinction matters: `prediction_source` triggers per-item gating logic; `credit_source` is treated as an insight-style metered call.

---

## 2 · Pre-decided architectural points

Sprint 1 itself should not need any of these — the punch-list items are about polish and stability inside the existing surface, not new product structure. However, if a sub-decision arises during the work that maps to one of the 6 locked architectural calls (watchlist as lifecycle store, status enum, MOVIES as rating store + `bookKey` link, partial-read-and-weights, rating UI placement, profile views), treat it as already-made per `roadmap/pre-sprint-decisions.md`. Do NOT re-litigate; do NOT block.

If a decision required is OUTSIDE that doc's table, raise a blocker per `§5` below.

---

## 3 · Sprint scope — the punch-list

Goal: make the current Books experience reliable, legible, and consistent enough to serve as the foundation for the ownership work coming in Sprints 2–5.

Six items below, any order. Each has an explicit **Done when**. All must be complete before the test gate in `§4` runs.

### Item 1 · Delete dead reasoning sections in `predict.js`

The film prompt was previously purified to source titles only from analogs + comparables, but the supporting functions still exist:

- `buildOnboardingContext()` — defined at `src/modules/predict.js:964`, no longer called by the film prompt assembly.
- `buildPredictionExamplesSection(profile)` — defined at `src/modules/predict.js:1826`, no longer included in `sections`.

**Action:** delete both function declarations. Remove the `profile.onboardingContext` field assignment from `buildTasteProfile()` if it exists.

**Done when:**
- `grep -rn "buildOnboardingContext\|buildPredictionExamplesSection" src/` returns no matches.
- `npx vite build` clean.
- Test gate passes (`§4`).

**Risk:** low. The functions are confirmed dead-on-prompt-path; removing them is code hygiene only.

---

### Item 2 · Curation parse failure should fall through to the existing shelves

Currently when `parseCurationJSON` returns `null` or `normalizeCuration` returns `null`, `curateBookShelf` throws `"Curation ran into a formatting issue. Please try again."` — the user has already been charged and sees the toast, but the **shelf is intact** because the cache wasn't overwritten. That's correct already, but the UX can be cleaner and more honest about the fall-through.

**Action:** when curation is unrecoverable, instead of throwing, return `{ safe: shelf.safe, upside: shelf.upside, curatedAt: null, _curatedFailed: true }`. In `book-ui.booksCurate`, detect `_curatedFailed` and show a short toast — *"Couldn't apply curation. Kept your existing shelves."* — without clearing them or breaking the cached state.

The failure must still be recorded via `track('book_curate_parse_failed', ...)` (already wired) and `window.__bookCurateError` (already wired) — no change there.

**Done when:**
- `src/modules/books/book-recommender.js` `curateBookShelf` no longer throws on parse failure; returns the existing shelves with `_curatedFailed: true`.
- `book-ui.booksCurate` displays the new toast on `_curatedFailed` and does not change `_safePool`/`_upsidePool`.
- New assertion added to `tests/curation-parse.test.mjs` or a new test file: proxy returns junk → `curateBookShelf` resolves to a shelf object with `_curatedFailed === true`.
- New Playwright e2e: mock the curate proxy to return `"not json"` and assert the existing shelf is still visible after click + toast says "Kept your existing shelves".
- Test gate passes (`§4`).

**Risk:** low-medium. Touches a metered path; make sure the credit accounting (already correct via `_credits` sync) is unchanged.

---

### Item 3 · Rename per-book "Re-rank" → "Re-rank this book"

The maintenance row was deliberately renamed to **"Update N ranked books · N credits"** to separate the bulk action from per-book ranking. The per-book modal button at `src/modules/books/book-ui.js:417` still reads **"↻ Re-rank · 1 credit"**, which collides with the prior bulk meaning.

**Action:** change the per-book button text to **"↻ Re-rank this book · 1 credit"**. The button id (`book-regen-btn`) stays. The `_runBookPrediction` handler's restore-on-error must read the new label correctly (it uses `orig = btn?.textContent`, so it does — no further change needed).

**Done when:**
- `src/modules/books/book-ui.js:417` text reads `"↻ Re-rank this book · 1 credit"`.
- Existing Playwright assertions pass (the existing test asserts the *new-prediction* button text — unaffected).
- Manual verification (or extended e2e): open a ranked book → button reads "Re-rank this book · 1 credit"; click → "Predicting…" → success → button resets to the new label.
- Test gate passes (`§4`).

**Risk:** trivial.

---

### Item 4 · One-time cache-bust for the film safe/upside shelves

Users who built the For You cache before the parity ship have `cachedRecommendations` (now interpreted as the safe shelf) and `cachedUpsideRecommendations: null` — so they see no upside lane until they hit Refresh. Mirror the prior `recs_taste_v2` migration in `src/modules/storage.js`.

**Action:** add a `parity_safe_upside_v1` flag block to `runMigrations()`. When unset and `currentUser` exists, null both `cachedRecommendations` and `cachedUpsideRecommendations` plus `lastRecommendationAt`, set the flag, persist locally + sync. Pattern is already in the file for `recs_taste_v2`.

**Done when:**
- New block in `src/modules/storage.js runMigrations` analogous to the existing `recs_taste_v2` block.
- Flag persisted to `MIGRATIONS_KEY` (`palate_migrations_v1`).
- `tests/navigation.spec.js` still passes (test fixture has no cached recs to clear — block is a no-op there, just sets the flag).
- Console log on activation: `Migration parity_safe_upside_v1: cleared stale For You cache so safe/upside both rebuild.`
- Test gate passes (`§4`).

**Risk:** low. Migration only clears regenerable caches — `predictions` and `bookPredictions` untouched.

---

### Item 5 · Verify `bookRegenerate` modal repaint after success

After re-rank, the modal should repaint with the new score badge + "Generated {date}" timestamp + button text reset to "Re-rank this book · 1 credit" without the user closing + reopening. The handler in `_runBookPrediction` calls `_renderBookModalShell(book, { prediction, predictedAt })` which should do this — verify with a manual or quick e2e.

**Action:** run a manual check in the dev server (or extend an existing e2e). If repaint already works, no code change; record verification in the sprint summary.

**Done when:**
- Either: manual verification noted in sprint summary, OR a focused Playwright spec asserts the post-rerank modal shows a `~score` badge + "Re-rank this book · 1 credit" label.
- Test gate passes (`§4`).

**Risk:** none if it already works; the test is the deliverable.

---

### Item 6 · Safe/upside For You e2e

There's no Playwright test that exercises the new safe + upside shelves on Discover. Add one. No TMDB mocking is needed — inject the cache directly.

**Action:** add a spec in `tests/foryou-safe-upside.spec.js` that:
1. Uses `injectAuthState` (from `tests/fixtures.js`) and `mockSupabase`.
2. Before `goto`, also injects `cachedRecommendations` and `cachedUpsideRecommendations` onto the test user via `addInitScript` — populate each with 3-4 minimal film objects (`{tmdbId, title, year, poster, predictionBacked:false, predTotal:null}`).
3. Navigates to Discover (`window.showScreen('predict')`).
4. Asserts `#foryou-secondary-grid .foryou-sec-card` count > 0 AND `#foryou-upside-grid .foryou-sec-card` count > 0.
5. Asserts the Safe-picks section header text contains "Safe picks" and the upside section header contains "High-upside picks".

**Done when:**
- New spec exists and passes on both desktop + mobile projects. (Block A's `npx playwright test` already runs everything in `tests/`, so the new spec is auto-discovered — no further wiring needed.)
- Test gate passes (`§4`).

**Risk:** low. No new orchestrator-side product judgment.

---

## 4 · Test gate (mandatory; sprint is NOT closed until this is clean)

The orchestrator must run these in the exact order shown. If any step fails, surface a blocker; do NOT mark the sprint complete.

```bash
# 1. Production build must be clean
npx vite build
# expect: "✓ built in …" with no errors. Chunk-size warnings are fine.

# 2. All node unit suites (each must pass)
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
# beta-attribution, plus any new spec added in this sprint (item 2's curate-
# failure e2e and item 6's safe/upside e2e).
# Do NOT skip suites just because they weren't touched in the sprint —
# regressions there are still regressions.

# 4. Dev server boots cleanly (trap ensures we kill it even on early-exit)
npm run dev &
DEV_PID=$!
trap 'kill "$DEV_PID" 2>/dev/null || true' EXIT
sleep 3
curl -fs http://localhost:5173/ > /dev/null && echo "✓ dev server up" || { echo "❌ dev server down"; exit 1; }
# EXIT trap kills the dev server cleanly on any exit path so the next sprint
# starts with port 5173 free.
```

If the sprint added new pure helpers, **a new node test suite must accompany them.** If the sprint added new UI surfaces, **at least one Playwright assertion must cover the new path.** This sprint adds two new specs by design (items 2 and 6).

After the sprint closes, kill stray dev servers (`lsof -ti:5173 | xargs kill -9`) so the next sprint starts clean.

---

## 5 · Blocker policy

Only pause for operator input when one of these is true:

1. A product decision has non-obvious consequences and no safe default exists in `pre-sprint-decisions.md`.
2. Two existing sources of truth conflict and proceeding risks corruption or regressions.
3. A navigation/IA decision would likely be expensive to reverse.
4. A third-party integration assumption is uncertain and could invalidate the work.
5. The brief is internally contradictory.

When blocked:
- Ask exactly one question if possible.
- Include the recommended answer first.
- Keep the request phone-friendly and fast to answer.
- Resume immediately once answered.

**For this sprint specifically:** none of the six items require product judgment beyond defaults already specified, and the architectural calls in `pre-sprint-decisions.md` should not be triggered. **No blocker is expected.** If one is needed, treat that as a signal to double-check whether the situation is already addressed in this brief or in `pre-sprint-decisions.md` before surfacing it.

---

## 6 · Autonomy policy

- Do not ask for permission on obvious implementation details.
- Make reasonable low-risk product assumptions and record them in the sprint summary.
- If the sprint can be completed cleanly without operator input, do so.

---

## 7 · Sprint close-out (mandatory before marking complete)

When all six punch-list items are done AND the test gate in `§4` is clean:

- [ ] All six items have their **Done when** boxes met.
- [ ] **Test gate (`§4`) passes end-to-end.**
- [ ] No stray dev servers running (`lsof -ti:5173` returns empty).
- [ ] Memory updated: append a short paragraph to `~/.claude/projects/-Users-noahcott-palatemap/memory/project_books_expansion.md` summarizing what shipped (item names + any deviations + test results).
- [ ] Sprint summary written and surfaced to the operator: (1) what shipped, (2) any deviations from the brief and why, (3) any follow-ups discovered during the work, (4) explicit statement that Sprint 2 is/isn't ready to begin.

Then STOP. Do not begin Sprint 2 unattended.
