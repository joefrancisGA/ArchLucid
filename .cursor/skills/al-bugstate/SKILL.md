---
name: al-bugstate
description: >-
  Run /al-bugstate: rolling 24h non-seed hit vs dry counts per bugsmash repo (sets 1-4).
  Read-only stats from run logs; optional fetch or local working tree.
---

# `/al-bugstate` — per-repo 24h hunt yield

When the user types **`/al-bugstate`**, execute **`.cursor/commands/al-bugstate.md`** in full.

1. Parse optional **`fetch`**, **`local`**, and set **`1`–`4`**.
2. Run **`.\scripts\agent\al-bug-state.ps1`** from repo root with matching switches.
3. Reply with the script table and a short total line.

Do **not** hunt, commit, or edit ledgers unless the user explicitly asks in a separate message.