# SN-LIFT-17 — Keep the decision-cycle row free of a timer

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

The sponsor decision-cycle summary says the log stays blank and names no duration.

## Why

Decision Velocity is 68 (weight 2). The row can drift into a promise about how fast a decision closes.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts`
- `docs/securenow/DECISION_CYCLE_LOG.md`

## What to build

1. Branch `sn-lift/17-decision-no-timer` from current `master`.
2. Set the `Decision cycle` summary to `Open the blank qualify-to-close log. Do not write a duration.`
3. Assert the summary does not match `/\d+\s*(minute|hour|day)/i` in `securenow-sponsor-home-copy.test.ts`.
4. Do not write times into `DECISION_CYCLE_LOG.md`.

## Tests

From `archlucid-ui`: `npx vitest run src/lib/product-line/securenow-sponsor-home-copy.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

The decision-cycle row points at the blank log and states no duration.
