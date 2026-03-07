# Handoff Protocol

Use this for every Claude/Codex task so work is consistent and reviewable.

## Task Brief Template
Copy this block into issue/PR/chat before implementation:

```md
## Objective
<what we are trying to accomplish>

## Why
<user/business reason>

## Scope
<in scope>

## Non-Goals
<out of scope>

## Acceptance Criteria
- [ ] ...
- [ ] ...

## Constraints
- stack constraints
- design constraints
- timeline constraints

## Likely Files
- path/file.js
- path/file.css

## Validation
- [ ] npm run build
- [ ] manual flow(s): ...

## Risks
- potential regressions
```

## Agent Split (Recommended)
- Claude outputs:
  - UX/content direction
  - interaction notes
  - acceptance criteria drafts
- Codex outputs:
  - concrete diffs
  - build verification
  - implementation risk notes

## Handoff Rules
1. One task brief at a time.
2. Keep diffs small; split big work into sequential briefs.
3. If scope changes, update acceptance criteria before coding.
4. Any architecture/deploy change must update docs in `docs/` in same PR.

## Done Checklist
- [ ] Acceptance criteria met
- [ ] Build passes
- [ ] Regressions spot-checked in touched flows
- [ ] Docs updated (if needed)
- [ ] Commit/PR notes include risk + rollback idea
