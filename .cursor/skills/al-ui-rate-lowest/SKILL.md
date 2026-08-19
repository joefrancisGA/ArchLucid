---
name: al-ui-rate-lowest
description: >-
  Run /al-ui-rate for the lowest UX-scored buyer-facing routes from the owner
  workbook: Opus critique, full fix backlog (P0/P1/P2), Composer ships every
  item, commit to master, update scores. No screenshot attachment required.
  Use when the user invokes /al-ui-rate-lowest or asks to fix the lowest UX
  routes from the traffic workbook.
disable-model-invocation: true
---

# /al-ui-rate-lowest — lowest UX routes critique and full remediation

Follow the full workflow in `.cursor/commands/al-ui-rate-lowest.md`.

Remediation rules match **`/al-ui-rate`**: ship **every** backlog item (P0, P1, P2), not P0-only.

## Invoke

```text
/al-ui-rate-lowest
/al-ui-rate-lowest 3
/al-ui-rate-lowest 1 --rate-only
```

- **`N`** (optional) — routes to process; default **1**
- **`--rate-only`** — critique + workbook scores only

## Pipeline (per route, sequential)

1. List lowest UX buyer-facing rows via `list-archlucid-ui-route-lowest-ux.py`
2. Resolve screenshot (ux-audit PNG → browser capture)
3. Run `/al-ui-rate` phases 1–4 for each route **ID**
4. One commit per route on **`master`** (unless `--rate-only`)

## Related

- `.cursor/commands/al-ui-rate-lowest.md` — canonical workflow
- `.cursor/commands/al-ui-rate.md` — single-route pipeline
- `/al-ui-lowest` — list only
