---
name: "source-command-al-bugstate"
description: "Use when the user invokes /al-bugstate for per-bugsmash-repo 24h hunt stats."
---

# source-command-al-bugstate

Use this skill when the user invokes **`/al-bugstate`**.

Follow **`.cursor/commands/al-bugstate.md`** end-to-end. That file is the authoritative procedure.

| Invocation | Behavior |
|------------|----------|
| `/al-bugstate` | All four sets from `origin/bugsmash-N` |
| `/al-bugstate fetch` | Same, after `git fetch` on bugsmash branches |
| `/al-bugstate local` | Working-tree run logs |
| `/al-bugstate 2` | Set 2 only |

Script: **`scripts/agent/al-bug-state.ps1`**.