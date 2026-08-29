# Sprint 1 — Books Polish + Stability (concrete punch-list)

Replaces the looser "make Books feel polished" framing with verifiable items the orchestrator can complete and check. Each item lists an explicit **Done when** condition. Items 1–4 are independent; do them in any order. **All items must pass the standard test gate (see `orchestrator-injection.md`) before sprint close.**

## 1 · Delete dead reasoning sections in `predict.js`

The film prompt was previously purified to source titles only from analogs + comparables, but the supporting functions still exist:

- `buildOnboardingContext()` — defined at `src/modules/predict.js:964`, no longer called by the film prompt assembly.
- `buildPredictionExamplesSection(profile)` — defined at `src/modules/predict.js:1826`, no longer included in `sections`.

**Action:** delete both function declarations. Remove the `profile.onboardingContext` field assignment from `buildTasteProfile()` if it exists.

**Done when:**
- `grep -rn "buildOnboardingContext\|buildPredictionExamplesSection" src/` returns no matches.
- `npx vite build` clean.
- All node + Playwright tests pass (see test gate).

**Risk:** low. The functions are confirmed dead-on-prompt-path; removing them is code hygiene only.

---

## 2 · Curation parse failure should fall through to the existing shelves

Currently when `parseCurationJSON` returns `null` or `normalizeCuration` returns `null`, `curateBookShelf` throws `"Curation ran into a formatting issue. Please try again."` — the user has already been charged and sees the toast but the **shelf is intact** because the cache wasn't overwritten. That's correct already, but the UX could be cleaner.

**Action:** when curation is unrecoverable, instead of throwing, return `{ safe: shelf.safe, upside: shelf.upside, curatedAt: null, _curatedFailed: true }`. In `book-ui.booksCurate`, detect `_curatedFailed` and show a short toast — *"Couldn't apply curation. Kept your existing shelves."* — without clearing them or breaking the cached state.

Also record the failure to `track('book_curate_parse_failed', ...)` (already wired) and to `window.__bookCurateError` (already wired) — no change there.

**Done when:**
- `src/modules/books/book-recommender.js` `curateBookShelf` no longer throws on parse failure; returns the existing shelves with `_curatedFailed: true`.
- `book-ui.booksCurate` displays the new toast on `_curatedFailed` and does not change `_safePool`/`_upsidePool`.
- New assertion added to `tests/curation-parse.test.mjs` or a new test file: proxy returns junk → `curateBookShelf` resolves to a shelf object with `_curatedFailed === true`. **Add a Playwright e2e: mock the curate proxy to return `"not json"` and assert the existing shelf is still visible after click + toast says "Kept your existing shelves".**
- Build clean. All tests pass.

**Risk:** low-medium. Touches a metered path; make sure the credit accounting (already correct via `_credits` sync) is unchanged.

---

## 3 · Rename per-book "Re-rank" → "Re-rank this book"

The maintenance row was deliberately renamed to **"Update N ranked books · N credits"** to separate the bulk action from per-book ranking. The per-book modal button at `src/modules/books/book-ui.js:417` still reads **"↻ Re-rank · 1 credit"**, which collides with the prior bulk meaning.

**Action:** change the per-book button text to **"↻ Re-rank this book · 1 credit"**. The button id (`book-regen-btn`) stays. The `_runBookPrediction` handler's restore-on-error must read the new label correctly (it uses `orig = btn?.textContent`, so it does).

**Done when:**
- `src/modules/books/book-ui.js:417` text reads `"↻ Re-rank this book · 1 credit"`.
- `tests/books-discover.spec.js` still passes (the existing test asserts the *new-prediction* button text — unaffected).
- Manual verification: open a ranked book → button reads "Re-rank this book · 1 credit"; click → "Predicting…" → success → button resets to the new label.

**Risk:** trivial.

---

## 4 · One-time cache-bust for the film safe/upside shelves

Users who built the For You cache before the parity ship have `cachedRecommendations` (now interpreted as the safe shelf) and `cachedUpsideRecommendations: null` — so they see no upside lane until they hit Refresh. Mirror the prior `recs_taste_v2` migration in `src/modules/storage.js`.

**Action:** add a `parity_safe_upside_v1` flag block to `runMigrations()`. When unset and `currentUser` exists, null both `cachedRecommendations` and `cachedUpsideRecommendations` plus `lastRecommendationAt`, set the flag, persist locally + sync. Pattern is already in the file for `recs_taste_v2`.

**Done when:**
- New block in `src/modules/storage.js` `runMigrations` analogous to the existing `recs_taste_v2` block.
- Flag persisted to `MIGRATIONS_KEY` (`palate_migrations_v1`).
- `tests/navigation.spec.js` still passes (test fixture has no cached recs to clear — block is a no-op there, just sets the flag).
- Console log: `Migration parity_safe_upside_v1: cleared stale For You cache so safe/upside both rebuild.`

**Risk:** low. Migration only clears regenerable caches — `predictions` and `bookPredictions` untouched.

---

## 5 · Verify `bookRegenerate` modal repaint after success (no fix expected)

After re-rank, the modal should repaint with the new score badge + "Generated {date}" timestamp + button text reset to "Re-rank this book · 1 credit" without the user closing + reopening. The handler in `_runBookPrediction` calls `_renderBookModalShell(book, { prediction, predictedAt })` which should do this — verify with a manual or quick e2e.

**Action:** run a manual check in the dev server (or extend an existing e2e). If repaint already works, no code change; record verification in the sprint summary.

**Done when:**
- Either: manual verification noted in sprint summary, OR a focused Playwright spec asserts the post-rerank modal shows a `~score` badge + "Re-rank this book · 1 credit" label.

**Risk:** none if it already works; the test is the deliverable.

---

## 6 · Safe/upside For You e2e (required, ~30 lines)

There's no Playwright test that exercises the new safe + upside shelves on Discover. Add one. No TMDB mocking is needed — inject the cache directly.

**Action:** add a spec in `tests/foryou-safe-upside.spec.js` that:
1. Uses `injectAuthState` (from `tests/fixtures.js`) and `mockSupabase`.
2. Before goto, also injects `cachedRecommendations` and `cachedUpsideRecommendations` onto the test user via `addInitScript` — populate each with 3-4 minimal film objects (`{tmdbId, title, year, poster, predictionBacked:false, predTotal:null}`).
3. Navigates to Discover (`window.showScreen('predict')`).
4. Asserts `#foryou-secondary-grid .foryou-sec-card` count > 0 AND `#foryou-upside-grid .foryou-sec-card` count > 0.
5. Asserts the Safe-picks section header text contains "Safe picks" and the upside section header contains "High-upside picks".

**Done when:**
- New spec exists and passes on both desktop + mobile projects. (Block A's `npx playwright test` already runs everything in `tests/`, so the new spec is auto-discovered — no further wiring needed.)

**Risk:** low. No new orchestrator-side product judgment.

---

## Sprint 1 close-out checklist

When all done:
- [ ] All items above marked done.
- [ ] **Test gate passes** (see `orchestrator-injection.md`).
- [ ] Dev server restart sanity check (`npm run dev` → curl `http://localhost:5173/`).
- [ ] Memory updated: short paragraph in `~/.claude/projects/-Users-noahcott-palatemap/memory/project_books_expansion.md` summarizing what shipped.
- [ ] Sprint summary written: what shipped, any follow-ups, readiness for Sprint 2.

**Nothing in this sprint requires product judgment beyond defaults already named.** No blocker expected.
