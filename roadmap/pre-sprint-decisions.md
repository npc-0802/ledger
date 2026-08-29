# Pre-sprint architectural decisions (Sprints 2 – 5)

These are decisions the orchestrator should treat as **already-made**, not blockers. They were thought through against the existing codebase; deviating from them requires an explicit operator override.

Each decision lists the alternative considered, why this one wins, and the exact code hooks the orchestrator should reach for so it doesn't have to re-derive the architecture.

---

## Decision 1 — Watchlist owns lifecycle; MOVIES owns rating data; they coexist linked by `bookKey`

**Decision:** for books, there are exactly **two stores with non-overlapping responsibilities**:

| Store | Owns | Per book |
|---|---|---|
| `currentUser.watchlist` (entry where `medium === 'book'`) | **lifecycle/intent state** — `status`, `addedAt`, `seenAt`, cover, author, year | the canonical "is this in My Books at all" record |
| `MOVIES` (entry where `medium === 'book'`) | **rating data** — `scores`, `total`, `rating_source`, scoring-feature metadata | exists ONLY if the user has rated the book |

The two are **linked by `bookKey`** (the existing stable id used elsewhere in the books pipeline). They do NOT replace each other. They do NOT duplicate state — `status` lives only on the watchlist entry, `scores` lives only on the MOVIES entry.

**My Books / Read List UI** is a view over `currentUser.watchlist` filtered to `medium === 'book'`. To show a book's *rating* alongside its *status*, the view joins each watchlist entry to its MOVIES twin (if any) by `bookKey`. A book is in My Books **iff** it has a watchlist entry; the MOVIES entry is presentation-augmenting, not membership-defining.

This mirrors how films already work conceptually: rating data lives in `MOVIES` regardless of whether the film is also on the watchlist. The difference for books is that we add an explicit `bookKey` link so the join is deterministic.

### Reconciliation rules (mandatory; orchestrator must implement these)

1. **Add a book to My Books** (any state) → upsert watchlist entry. No MOVIES entry created.
2. **Rate a book** (Sprint 3) → upsert MOVIES entry keyed by `bookKey` with `medium:'book'`, `rating_source:'book_manual'`, complete `scores`, computed `total`. The watchlist entry **stays** and gets `status:'read'` (and `seenAt:<now>` for parity with film "seen" semantics).
3. **Edit a rating** → upsert the MOVIES entry by `bookKey`. Watchlist entry unchanged.
4. **Remove from My Books** (user explicitly deletes the book) → delete the watchlist entry **AND** delete any matching `medium:'book'` MOVIES entry with the same `bookKey`. This is the rule that prevents orphan scoring data after a removal.
5. **Change status without rating** (e.g., `reading → stopped`) → update watchlist entry only. MOVIES untouched.

There is no "move" operation. Rated books are simply in **both** stores; unrated books are in **only** the watchlist; orphan MOVIES entries (no watchlist parent) are forbidden by rule 4.

**Why this architecture:** keeps each store responsible for one concern (lifecycle vs scoring); the join-by-`bookKey` is cheap and deterministic; matches the existing books pipeline (`bookKey` is already the canonical id); removing from My Books has one rule with no ambiguity. Single-store alternatives would have forced either (a) lifecycle status to live on MOVIES (polluting the scoring array) or (b) full ratings to live on watchlist (polluting the lifecycle store + breaking `computeRatingWeights` which reads from MOVIES).

**Code hooks the orchestrator should reuse:**
- `src/modules/watchlist.js` `addToWatchlist`, `removeFromWatchlist`, `markAsSeen`, `openWatchlistDetail` — already medium-aware (book branch routes to `openBookDetailFromObject`).
- `currentUser.watchlist` array — `medium:'book'` items only need their `status` field expanded (see Decision 2).
- `bookKey` is set by `addToWatchlist` for books and survives through the lifecycle.
- The MyFilms tab structure (`#myfilms-tab-rated` / `#myfilms-tab-watchlist`) is a useful precedent for the Books tab pair (`Rated` / `Reading List`), but DO NOT touch MyFilms.

**What an orchestrator must NOT do:**
- Create `currentUser.readList`, `currentUser.bookLibrary`, or any sibling store.
- Add new columns to `palatemap_users` (see Gotcha 1 in `orchestrator-injection.md`).
- Implement a "move on rating" that deletes the watchlist entry — that violates rule 2.
- Allow MOVIES entries with `medium:'book'` to exist without a parent watchlist entry — that violates rule 4.

---

## Decision 2 — Status enum, and exactly how it maps to existing values

**Decision:** the watchlist `status` field expands to:

| New value | Meaning | Applies to |
|---|---|---|
| `want_to_read` | saved intent, not started | books only |
| `reading` | in progress | books only |
| `read` | completed (eligible for rating) | books only |
| `stopped` | partial / discontinued (not eligible for rating) | books only |
| `watch` | saved intent (films) | films only — unchanged |
| `seen` | completed (films) | films only — unchanged |

Film status semantics **do not change**. Only books gain the four new values.

**Migration of existing book watchlist entries** (one-shot, flag-guarded, in `runMigrations`):

| Existing | New |
|---|---|
| book with `status:'watch'` (or absent) | `status:'want_to_read'` |
| book with `status:'seen'` and no rating | `status:'read'` (treat as completed; user can later remove or correct) |
| book with `status:'seen'` and a rating present | `status:'read'` |

There are essentially no rated books today (Phase 1 has no book rating flow), so the second/third rows are nearly empty in practice — but the migration must be safe regardless.

**Why this mapping:** preserves the user's intent (`watch` was always "I want to consume this"); `seen` on books was rare and best read as completed. The migration is idempotent because the flag prevents repeat runs.

**Code hooks:**
- `src/modules/storage.js` `runMigrations` — add flag `book_status_v1` block analogous to existing `recs_taste_v2` block.
- After migration, all existing book entries have a meaningful status; new book additions should default to `want_to_read` (change in `book-ui.bookAddToList` and any other book add path).

---

## Decision 3 — Rated-book scoring data lives in the `MOVIES` array with `medium:'book'` (coexists with watchlist twin)

**Decision:** when a user rates a book, a corresponding entry is upserted into `MOVIES` carrying `medium:'book'`, the same 8-category `scores` object, `total`, `rating_source:'book_manual'`, and book-specific fields (`bookKey`, `openLibraryId`, `isbn`, `author`, `year`). This entry coexists with the book's watchlist entry (see Decision 1) — it does NOT replace it. We do NOT introduce a separate `BOOKS` array.

**Why:** the universal-medium architecture was always the intended endpoint. `computeRatingWeights(medium)` at `src/modules/weight-blend.js:160` already takes an optional medium filter and filters `MOVIES` by `m.medium || 'film'`. `taste-summary.buildTasteSummary({ medium })` follows the same pattern. Spinning up a parallel `BOOKS` array would force every consumer (rankings, supabase sync, migrations, analytics) to dual-write.

**Code hooks:**
- `src/state.js` `MOVIES` — no shape change needed; book items just have `medium:'book'` + `bookKey`.
- `src/modules/weight-blend.js` `computeRatingWeights(medium)` — already filters; ready.
- `src/modules/taste-summary.js` `buildTasteSummary({ medium })` — already filters; ready.
- `src/modules/supabase.js` `syncToSupabase` payload — `movies: MOVIES` already serializes any items; book entries will sync via the same field. **No new column needed** (see Gotcha 1).
- Rated book → `MOVIES.push({ medium:'book', bookKey, title, author, year, openLibraryId, isbn, scores: {...}, total, rating_source:'book_manual', addedAt: ... })` AND watchlist entry stays with `status:'read'`.

**What an orchestrator must NOT do:**
- Add `currentUser.bookRatings` or `BOOKS` as a separate array.
- Add a `books` column to the `palatemap_users` upsert payload (see Gotcha 1).
- Remove the watchlist entry on rating — that's a "move" and violates Decision 1 rule 2.
- Push a MOVIES book entry without a corresponding watchlist entry (orphans are forbidden per Decision 1 rule 4 — auto-create the watchlist entry if it's somehow missing).
- Touch `prediction_log` schema for book rating logging unless explicitly approved.

---

## Decision 4 — Only `read`-with-rating books contribute to taste weights

**Decision:** for the purposes of `computeRatingWeights('book')` and `buildTasteSummary({ medium:'book' })`, only items with `medium:'book'`, `rating_source` present, and complete `scores` count. `want_to_read`, `reading`, and `stopped` watchlist entries do **not** have MOVIES twins (no rating, no scoring data). `read`-without-a-rating items have a watchlist entry but no MOVIES twin and therefore also do not count toward weights — completion alone isn't taste evidence.

This default carries through Sprint 3 and Sprint 4 — orchestrator should apply the same rule in both sprints without re-asking.

**Why:** weights are derived from a comparable 8-category score profile. A `stopped` book has no scores. Treating intent or completion as evidence (instead of an actual rating) would silently bias the profile. Cleanest default.

**Code hooks:**
- The rating flow (Sprint 3) **upserts** a MOVIES twin (`medium:'book'`, full `scores`, `rating_source:'book_manual'`) linked to the watchlist entry by `bookKey`. The watchlist entry stays put with `status:'read'` (Decision 1 rule 2). Until the MOVIES twin exists, weights are unaffected.
- `book-predict.js generateBookPrediction` reads `MOVIES` for the taste profile — naturally picks up rated books once their MOVIES twins exist.

**If the operator later wants partial reads to count:** flip to a `confidence_weighted` model (low-confidence weight for stopped books with partial scores). Out of scope for Sprints 2–4.

---

## Decision 5 — Book rating UI lives in a new screen, not bolted into Add Film

**Decision:** book rating is its own flow under `My Books` (or `Discover > Books > Detail`). It does NOT use the existing `Add Film` screen / `addfilm.js`. The 8-category score collection UI (sliders) **can be reused as a shared component**, but the entry point and surrounding context (book metadata, "stopped at page X?" prompts in Sprint 4) are book-specific.

**Why:** Add Film is heavily film-shaped (TMDB search, cast/director steps, head-to-head onboarding). Bolting books on creates a forked monstrosity. A focused book rating screen keeps both surfaces clean.

**Code hooks:**
- Look at `src/modules/addfilm.js` head-to-head (`hth*`) and slider rendering — the slider component is reusable. Extract to `src/modules/scoring-ui.js` if needed (do this in Sprint 3, not Sprint 1).
- New module suggestion: `src/modules/books/book-rate.js` exporting `openBookRatingFlow(book)`.

**Open call this leaves to operator:** does book rating use head-to-head onboarding for first-time book raters, or skip straight to absolute sliders? Default: **skip head-to-head for books in Sprint 3** (the cold-start signal already comes from film ratings). Revisit if cold-start quality becomes an issue.

---

## Decision 6 — Profile/archetype stays single-identity (Sprint 5)

**Decision:** archetype remains one identity across both media. The Profile screen gains a **per-medium weights toggle** (Overall / Film / Book) only when the user has ≥3 rated books. Below that threshold, the toggle is hidden; everything reads as it does today.

**Why:** archetype is a summary layer; computing it per-medium would force the user to reconcile two identities with no real product win. The film-first default for low-book-rating users prevents IA clutter.

**Code hooks:**
- `src/modules/profile.js` rendering — add a small toggle row that filters which weights vector is displayed.
- Use `MOVIES.filter(m => (m.medium||'film')==='book').length >= 3` as the gate.

**What an orchestrator must NOT do:**
- Introduce per-medium archetypes.
- Force a navigation redesign.

---

## Summary table — what's locked, what's open

| Concern | Locked decision | Open to operator |
|---|---|---|
| Source of truth | watchlist owns lifecycle; MOVIES owns rating data; linked by `bookKey`; reconciliation rules in Decision 1 | — |
| Status enum & migration | 4 book values; mapping above | — |
| Where rating data lives | MOVIES with `medium:'book'`, **coexisting** with the watchlist twin (no "move") | — |
| Partial-read & weights | only `read`+rating (i.e., presence of a MOVIES twin) counts | revisit later if quality drops |
| Rating UI | own screen, sliders reused | head-to-head for books? (default: no) |
| Profile views | single archetype + per-medium weights toggle ≥3 books | nav redesign (default: no) |

If the orchestrator hits a decision NOT in this table, it must block. If it hits one IN this table, it must NOT block.
