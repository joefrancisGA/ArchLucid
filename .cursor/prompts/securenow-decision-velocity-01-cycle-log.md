# SN-DV-01 — Blank decision-cycle log

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-DV prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_DECISION_VELOCITY_COMPOSER_PROMPTS.md`

## Goal

`docs/securenow/DECISION_CYCLE_LOG.md` is a blank timer for one sponsor disposition, from Qualify to Close. A person fills it. SecureNow does not start the clock or select the outcome.

## Why

Decision Velocity is **63** (weight 2). `DECISION_PATH_ONE_PAGER.md` already names six steps, and `PILOT_DECISION_RECORD.md` already holds the three outcomes. Neither record stores when the cycle started, when it closed, or which step stalled. `PILOT_MEASUREMENT_LOG.md` times an investigation in minutes for ROI. This log is a different instrument.

## Read first

- `docs/securenow/DECISION_PATH_ONE_PAGER.md` (step names; do not edit it)
- `docs/securenow/PILOT_DECISION_RECORD.md` (outcome words; do not edit it)
- `docs/securenow/PILOT_MEASUREMENT_LOG.md` (vocabulary only; do not edit it)

## What to build

1. Branch `sn-dv/01-cycle-log` from current `master`.
2. Add `docs/securenow/DECISION_CYCLE_LOG.md`.
3. First line is a scope line: blank instrument, not a customer result, not an ROI claim, beta remains **NO_GO**.
4. Heading: `SecureNow decision cycle`.
5. One lead sentence: a person records one cycle from Qualify to Close. Leave times and the outcome blank until that person has them.
6. A table with these columns: `Cycle`, `Question`, `Qualify started (UTC)`, `Close recorded (UTC)`, `Stall step`, `Outcome`, `Note`.
7. Three rows:
   - Row 1: `SYNTHETIC FIXTURE` in Cycle and Question. Every other cell is `BLANK`. The Note says the row is a shape example for `fixture-path-01` and is not a customer result.
   - Rows 2 and 3: `BLANK` in every cell.
8. A short section `Stall step` listing these six names, in this order: Qualify, Scope, Review, Decide change, Verify, Close. One sentence: the stall step is the step that consumed the wait, and a person picks one.
9. A short section `Outcome` listing these three lines, unchanged from the decision record: `Proceed to commercial discussion`, `Extend with bounded scope`, `Stop`. One sentence: the outcome stays blank until a person selects it on `PILOT_DECISION_RECORD.md`.
10. A closing paragraph: this log does not fill the ROI measurement log, does not convert minutes into dollars, and does not clear beta **NO_GO**.
11. Add one bullet to `docs/securenow/README.md` under the cutting-edge prompt bullet: this log is the blank qualify-to-close timer. It is not a filled pilot and not the ROI minute log.

## Tests

No UI test in this session. Read the new file and confirm it contains `NO_GO`, `SYNTHETIC FIXTURE`, `BLANK`, the six stall names, the three outcome lines, and no `$`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `PILOT_DECISION_RECORD.md`, `DECISION_PATH_ONE_PAGER.md`, `PILOT_MEASUREMENT_LOG.md`, or `PRIVATE_PRICE_SHEET.md`.
- Do not write a clock time, a customer name, or a selected outcome into the log.
- Do not commit.

## Done when

`docs/securenow/DECISION_CYCLE_LOG.md` is a blank qualify-to-close table with one synthetic shape row and two blank rows.
