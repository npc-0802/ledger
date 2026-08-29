# Recommender — design note (books shipped, film parity + distillation roadmap)

## The staged pipeline (books, `reco_v1`)

Explicit, inspectable funnel — each stage is a separate module so stages can be
swapped/trained independently:

| Stage | Module | Cost | Objective |
|------|--------|------|-----------|
| A — taste-shaped retrieval | `book-queries.js` + `book-api.searchBooksBySubject` | free (Open Library) | **recall**: pull a broad pool (≈100–250) from the corpus regions the profile points at |
| B — cheap rerank | `book-recommender.rerankCandidates` | free, local | approximate fit + ceiling; emit **two** objectives: `safe_score`, `upside_score` |
| C — batch curation | `book-recommender.curateBookShelf` | 1 credit, **cached** | one reasoned pass → ranked safe + upside shortlists (structured JSON) |
| D — per-item prediction | `book-predict.generateBookPrediction` | 1 credit each, durable | deep "would I like this?" on a specific book |

Pool sizes: per-query 20 → deduped pool (with provenance) → rerank keep 40 → safe shelf 24 / upside shelf 12 → curated 8 + 8.

### Safe vs upside are genuinely different objectives
- `safe_score = baseFit × (0.55 + 0.45·metaQuality)` — alignment + subject affinity − boundary risk, **confidence-weighted**.
- `upside_score = 0.4·baseFit + 0.85·upsideTerm − boundary/2`, where `upsideTerm` rewards **dimension spikes (peakiness), singularity/hold, rating ceiling** and tolerates lower certainty. This is the direct fix for "everything's an 84" — upside surfaces 90+ candidates the safe objective would never float.

### Caching
Shelf cached in localStorage by **profile fingerprint** (`reco_v1 | nFilms | rounded weights`) + method version, 5-day TTL. Curation overlay stored on the same cache entry; `Refresh` forces a rebuild (drops curation). For the public product this makes Stage C ≈ one call per user per few days.

### Distillation-readiness (Lever C)
Retrieval / cheap scoring / curation are separate, and curation + per-item predictions are logged with structured outputs. That's the training corpus: a future local reranker can be trained to mimic the deep layer, so selection and explanation converge at ~zero marginal LLM cost. Nothing ML is built yet — the seams are.

## How this maps to film (later)

Film already has a bigger corpus (TMDB) and a richer candidate generator (`buildDiscoveryPool`, tag-genome) than books had, so film needs *reframing*, not rebuilding:

1. **Two objectives, not one.** `scoreCandidate` currently optimizes a single fit score. Split it into `safe_score` / `upside_score` exactly as books do — reward TMDB/tag-genome signals of ceiling (singularity, hold, divisiveness, peaky category fingerprints) for the upside lane. This is the highest-leverage film change and is a shared-helper candidate (`taste-summary` already exposes defining +/- prefs and boundaries both engines can read).
2. **Widen the funnel for upside.** Discovery already does "new territory"; bias a slice of retrieval toward high-ceiling/low-certainty rather than safe-fit, so the film hero/discovery rows aren't all mid-high-80s.
3. **Selection alignment.** Film auto-predicts its hero/discovery (metered), so a Stage-C batch curation is less necessary there — but the *cheap selection* should still consume the full taste summary (defining prefs/boundaries/tensions), not just the weight vector, so the items chosen for deep prediction are the right ones.

Shared helper worth extracting when film parity starts: a generic `score(candidateDims, tasteSummary) → { safeScore, upsideScore, features }` that both `book-recommender` and film `scoreCandidate` call, keyed off `taste-summary`. Books proves the shape first.

## Remaining limitations (first pass)
- Books still derive taste from films (no rated books yet); `computeRatingWeights(medium)` is already wired for when book ratings exist.
- Cheap-layer book representation is still tag-map–based (no description embeddings yet) — the natural next retrieval upgrade.
- Curation candidate pool = assembled shelves (~36), close to but not exactly "top 40 by baseFit".
- No distilled reranker yet (by design) — the logging seams are in place.
