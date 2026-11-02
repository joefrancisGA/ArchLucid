# SN-LIFT-12 — Say investigation effort is not a savings claim

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

The investigation-effort page says it is not a savings claim.

## Why

Proof-of-ROI Readiness is 68 (weight 5). The page already refuses a timer, ROI calculation, and fees. It does not say the blank log is not a savings claim.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-investigation-effort-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView.tsx`

## What to build

1. Branch `sn-lift/12-roi-not-savings` from current `master`.
2. Extend `SECURENOW_INVESTIGATION_EFFORT_GUARDRAIL` so it also says `This page is not a savings claim.`
3. Assert that sentence in the page test.
4. Do not write a minute value, a dollar amount, or a result into `PILOT_MEASUREMENT_LOG.md`.

## Tests

From `archlucid-ui`: `npx vitest run src/app/(operator)/administration/securenow-investigation-effort/SecureNowInvestigationEffortPageView.test.tsx`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

The investigation-effort page says it is not a savings claim.
