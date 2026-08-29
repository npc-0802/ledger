# Sprint 1 — "Run it tonight" operator checklist

One screen. Do the steps in order. Each step has a verify line — don't skip it.

> If something fails before you leave the house, the orchestrator won't recover at dinner. Verify on the laptop before the phone.

---

## Before you walk out (target: ~10 min)

### 1 · Bring the services up

```bash
~/claude-codex-orchestrator/start-orchestrator.sh --build
```

Watch for: `✓ API up` and `✓ Frontend up`. **Leave this terminal open.** Ctrl-C here is your kill switch for everything.

### 2 · Expose the frontend via Tailscale (second terminal)

```bash
tailscale serve --bg --https=443 http://localhost:3000
tailscale serve status
```

Verify status prints: `https://noahs-macbook-pro-2.tail3a8032.ts.net → http://127.0.0.1:3000`

### 3 · Supabase Auth → Redirect URLs (web, ~30 sec)

Confirm these two are saved on your Supabase project:

```
https://noahs-macbook-pro-2.tail3a8032.ts.net
https://noahs-macbook-pro-2.tail3a8032.ts.net/**
```

### 4 · Hand Sprint 1 to the orchestrator

```bash
cat /Users/noahcott/palatemap/roadmap/sprint-1.md | pbcopy
```

Then paste into the orchestrator's "start sprint" surface (whatever the active control plane uses for sprint kickoff). The brief is self-contained — no other docs need to be loaded for Sprint 1.

### 5 · Phone pre-flight (do BEFORE leaving the house)

On your phone:
- Open Safari → `https://noahs-macbook-pro-2.tail3a8032.ts.net`
- Sign in via Supabase magic link (delivers to your email; open it on the phone, not the laptop)
- Verify the operator console loads and shows the active sprint as Sprint 1
- Open one sprint view to confirm frontend → API works (any data showing = API reachable)

If any of these fails, **fix on the laptop now**, not at dinner.

### 6 · Fallback SSH check (optional but worth 60 sec)

Verify you can SSH in from the phone if anything goes sideways:

```bash
# From a separate laptop terminal (proves SSH is reachable on the tailnet):
ssh you@noahs-macbook-pro-2.tail3a8032.ts.net 'echo ok'
```

Returns `ok`? Then from your phone (Termius/Blink) you can `tail -f ~/orch-logs/*.log` or restart things if needed.

---

## While you're out

### Phone notifications

- If the orchestrator hits a blocker (it shouldn't for Sprint 1 — the brief is decision-free), the operator console pushes/shows it. Respond from the form. The brief specifies the recommended answer first.
- If you see no activity for >30 min, that's worth a glance — could be a long Playwright run, could be a hung step. SSH in and `tail -f ~/orch-logs/*.log` to check.

### What "done" looks like

Sprint 1 completes when the orchestrator's sprint summary surfaces with:
- All 6 punch-list items marked done
- Test gate (§4 of the brief) all green
- Memory paragraph appended
- Explicit "Sprint 2 ready to begin" (or "blocked by X")

**The orchestrator will NOT advance to Sprint 2 unattended** — the brief says STOP. So once you see the close-out, the system is idle until you decide what's next.

---

## Recovery — if something looks wrong from your phone

| Symptom | Action |
|---|---|
| Page won't load on `*.ts.net` | `tailscale status` from phone (Tailscale app) — is laptop online? If yes, SSH in and `tail -f ~/orch-logs/frontend.log` |
| Frontend loads but API errors | SSH in, check `~/orch-logs/api.log`, last lines |
| Orchestrator silent for >1h | SSH in, check whatever the orchestrator's run log path is. If it's wedged, restart with `Ctrl-C` in Terminal 1 (kills everything cleanly) then re-run `start-orchestrator.sh` |
| Laptop went to sleep | Plug it in. `caffeinate -dimsu` is in the script so this should not happen, but it's the most common failure mode of unattended laptops |

---

## When you get home

If Sprint 1 closed cleanly:
- Read the sprint summary in the orchestrator console
- Skim `git log --oneline -20` and `git diff main` in the repo to spot-check what shipped
- If satisfied: assemble the Sprint 2 brief by repeating the assembly process — Sprint 2 needs `pre-sprint-decisions.md` + `orchestrator-injection.md` Blocks A + B + the Sprint 2 punch-list (which doesn't exist yet — Sprint 2 brief will need to be written, the punch-list approach is your call)
- Hand it off the same way

If Sprint 1 surfaced a blocker you couldn't resolve from the phone:
- The orchestrator paused; nothing's broken
- Resolve on the laptop and let it resume

If the test gate failed:
- The sprint did NOT close. The orchestrator should have surfaced the failing step. Fix on the laptop, re-run the gate, then mark closed.
