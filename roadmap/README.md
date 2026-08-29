# Roadmap docs

Three files that turn the Codex roadmap into something an orchestrator can execute against safely while the operator is on a phone.

| File | What it is | Where it goes |
|---|---|---|
| [`sprint-1-punchlist.md`](./sprint-1-punchlist.md) | Concrete, verifiable Sprint 1 (replaces "polish + stability") | Hand to the orchestrator AS the Sprint 1 brief |
| [`pre-sprint-decisions.md`](./pre-sprint-decisions.md) | The 6 architectural calls baked into Sprints 2–5, pre-decided so phone-blockers stay rare | Reference from every Sprint 2+ brief |
| [`orchestrator-injection.md`](./orchestrator-injection.md) | Test gate (Block A) + project-specific gotchas (Block B) | Paste both blocks into every sprint brief |

## How to use them in practice

**Before walking away from the laptop:**
1. Skim `pre-sprint-decisions.md` and confirm you agree with all 6 calls. If you disagree with any, note the change before handing it off.
2. Have Codex (or yourself) rewrite Codex's roadmap into **5 individual sprint briefs (Sprints 1–5 only)**, **one at a time**, with `orchestrator-injection.md` Blocks A + B pasted into each. **Sprint 6 is explicitly out of scope for autonomous execution — do not prepare a brief for it; see below.**
3. Hand Sprint 1 to the orchestrator first. Don't queue all 5.

**Per-sprint loop (from phone):**
1. Sprint starts → orchestrator works autonomously.
2. If it surfaces a blocker → check whether the question is already answered in `pre-sprint-decisions.md`. If yes, reply with the locked decision. If no, decide on the phone and (if the call is durable) update the doc.
3. Sprint closes → verify the test gate (Block A) ran clean. If it didn't, the sprint isn't done.
4. Confirm readiness → hand the next sprint brief.

## What's deliberately NOT in here (Sprint 6 = excluded)

- **Sprint 6 (Books Ecosystem Layer)** — too vague for autonomous execution. **Do not have the orchestrator prepare or run a Sprint 6 brief.** Keep it as a *future feature backlog* and revisit by picking one concrete feature later (e.g., "expand credentials data to N entries" or "add a Libby search-out link on book detail") and writing it up as its own one-off ticket, not as a sprint.
- **Detailed UI mockups** — none of these sprints require pixel-perfect designs in advance. The existing visual system is opinionated enough.
- **Embedding / distillation roadmap** — separate track, post-books-ownership.
