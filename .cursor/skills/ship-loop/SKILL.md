---
name: ship-loop
description: >-
  Run /ship-next-improvement on a recurring interval until the ship queue is
  exhausted, then stop the loop (no fresh assessment churn).
disabled-environments:
  - cloud
---

# /ship-loop — ship backlog items until exhausted

## Parse

Accept `/ship-loop [interval] [/ship-next-improvement flags…]`.

Examples:

- `/loop 30m /ship-next-improvement`
- `/loop 1h /ship-next-improvement` on branch `feature/foo` (pass branch in the ship command if needed)

Default interval when omitted: **30m** (owner may override).

Combine the **`loop` skill** dynamic schedule with **`/ship-next-improvement`**:

1. Each wake runs **`/ship-next-improvement`** once (single pass — at most one TB item).
2. If the run **ships** something (steps 1–4), re-arm the next loop wake.
3. If the run ends at **Step 6 — Queue exhausted**, **stop the loop** (see below). Do **not** arm another wake.
4. If the run ends **blocked at preview** (dirty tree, open dependency), **stop the loop** and report blockers — do not spin forever on the same blocker.
5. **Fresh assessment** runs only when the user passes **`--refresh-assessment`** on the ship command; an empty queue does **not** auto-trigger assessment in a loop.

## Stop conditions (mandatory)

**Kill the loop** when any of these occur:

| Outcome | Action |
| --- | --- |
| **Step 6 — Queue exhausted** | Print sentinel, kill sleeper, do not re-arm |
| **Blocked at Step 0 preview** | Kill sleeper, do not re-arm |
| User says **stop** | Kill sleeper per `loop` skill |

Do **not** keep looping after **`SHIP QUEUE EXHAUSTED — STOPPING`**.

## Sentinel

On queue exhausted, the ship command prints:

```text
SHIP QUEUE EXHAUSTED — STOPPING
```

Use `notify_on_output` with pattern `^SHIP QUEUE EXHAUSTED` only when the user asked to monitor for exhaustion; otherwise rely on the agent reading the ship command report.

## Dynamic wake (recommended)

After each **successful ship** (commit pushed, CI gate addressed per ship command):

```powershell
$seconds = 1800  # match chosen interval
Start-Sleep -Seconds $seconds
Write-Host ('AGENT_LOOP_WAKE_SHIP {0}' -f (@{ prompt = '/ship-next-improvement' } | ConvertTo-Json -Compress))
```

On **queue exhausted** or **blocked**: do **not** schedule the next sleep; kill any existing `AGENT_LOOP_WAKE_SHIP` sleeper.

## Guidance

- Title shell commands: `Loop every 30m: /ship-next-improvement`.
- Prefer **`git commit --only -- <paths>`** discipline from the ship command when the tree is dirty.
- Run **`/show-all-improvements`** once before a long loop if you want a queue-size estimate (read-only).
- For assessment refresh after a plateau, run **`/ship-next-improvement --refresh-assessment`** as a **one-off** — not inside the loop.
