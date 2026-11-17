# SN-LIFT-01 — Operator page for the five fixture walks

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

`/administration/securenow-scenario-walks` lists the five rows in `docs/securenow/SCENARIO_CHOOSER.md`.

## Why

Template and Accelerator Richness is 64 (weight 1). The chooser is a markdown file. Home does not open it.

## Read first

- `docs/securenow/SCENARIO_CHOOSER.md`
- `archlucid-ui/src/app/(operator)/administration/securenow-return-reasons/SecureNowReturnReasonsPageView.tsx`
- `archlucid-ui/src/lib/product-line/product-line-catalog.ts`

## What to build

1. Branch `sn-lift/01-scenario-page` from current `master`.
2. Add `archlucid-ui/src/lib/product-line/securenow-scenario-walks-copy.ts`:
   - Heading `Fixture walks`.
   - Lead `Five fixture walks. Not customer evidence. SecureNow beta remains NO_GO.`
   - Guardrail `A fixture walkthrough is not a customer outcome and not a starter proof pack.`
   - Five rows, in chooser order, with the scenario id, buyer job, and honest label copied from the chooser. Ids: `public-storage-path`, `collection-gap`, `advisory-cut-no-write`, `later-capture-not-verified`, `contributor-role-between-snapshots`.
3. Add the operator page and view. `data-testid="securenow-scenario-walks-page"`. Use `OperatorPageContainer` and `OperatorPageHeader`.
4. Assign `"/administration/securenow-scenario-walks": "security"` in `PRODUCT_LINE_EXTRA_ASSIGNMENTS`. Allow it for `security` and refuse it for `architecture` in `product-line-catalog.test.ts`.
5. Add a page test for `Not customer evidence`, `NO_GO`, and all five ids. The rendered text must not contain `$`.

## Tests

From `archlucid-ui`: `npx vitest run src/app/(operator)/administration/securenow-scenario-walks/SecureNowScenarioWalksPageView.test.tsx src/lib/product-line/product-line-catalog.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

An operator can open the five fixture walks, and the page says they are not customer evidence.
