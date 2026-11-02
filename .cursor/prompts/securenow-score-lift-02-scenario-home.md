# SN-LIFT-02 — Home section for the fixture walks

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

SecureNow Home has a Fixture walks section with one row to the operator page.

## Why

SN-LIFT-01 adds the page. Home still does not name it.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-return-home-copy.ts`
- `archlucid-ui/src/components/product-line/SecureNowReturnHomeSection.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.tsx`

## What to build

1. Branch `sn-lift/02-scenario-home` from current `master` after SN-LIFT-01.
2. Add `securenow-scenario-home-copy.ts` and `SecureNowScenarioHomeSection.tsx` in the same shape as the return-reasons home section.
   - Heading `Fixture walks`.
   - Lead `Pick one fixture. Do not present it as a customer outcome. SecureNow beta remains NO_GO.`
   - One row: href `/administration/securenow-scenario-walks`, label `Five fixture walks`, summary `Honest labels for storage, collection gaps, advisory cuts, not-verified, and a unit fixture.`
3. Render the section from the SecureNow infrastructure overview next to the other SecureNow home sections. Do not set `recommendedFirst`.
4. Add a copy test for the heading, the href, and the absence of `$`.

## Tests

From `archlucid-ui`: `npx vitest run src/lib/product-line/securenow-scenario-home-copy.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

SecureNow Home shows Fixture walks and links the operator page.
