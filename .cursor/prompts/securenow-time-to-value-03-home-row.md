# SN-TTV-03 — One Home row for the first useful answer

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-TTV prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE66_COMPOSER_PROMPTS.md`

## Goal

SecureNow Home links the first-useful-answer section. **Start here** stays five rows.

## Why

The definition is on the first-hour page. Home does not point at it. Adding a sixth **Start here** row would collide with the shipped SN-ADOPT-06 contract.

## Read first

- `archlucid-ui/src/components/product-line/SecureNowSelfServiceHomeSection.tsx`
- `archlucid-ui/src/components/product-line/SecureNowHomeDestinationSection.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.securenow.test.tsx`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts` (do not add a row)

## What to build

1. Branch `sn-ttv/03-home-row` from current `master` after SN-TTV-02 is present.
2. Add `archlucid-ui/src/lib/product-line/securenow-first-useful-answer-home-copy.ts`:
    - Heading `First useful answer`.
    - Lead `Collection status, one ranked path, and one review question. This is not a timed SLA. SecureNow beta remains NO_GO.`
    - One row. `href` is `/administration/securenow-first-hour#first-useful-answer`. Label `Three visible facts`. Summary `A missing capture is still a status. Do not open verification yet.`
    - Do not set `recommendedFirst`.
3. Add `SecureNowFirstUsefulAnswerHomeSection.tsx` using `SecureNowHomeDestinationSection`. `sectionTestId` is `securenow-first-useful-answer-home-section`. `linkTestIdPrefix` is `securenow-first-useful-answer-home-link`.
4. In `InfrastructureOverviewClient.tsx`, render that section immediately after `SecureNowFirstHourHomeSection`, inside the same `secureNowHome` guard.
5. In `InfrastructureOverviewClient.securenow.test.tsx`, insert `securenow-first-useful-answer-home-section` immediately after `securenow-first-hour-home-section` in the section-order array. Assert the new link href.
6. Add `securenow-first-useful-answer-home-copy.test.ts`. Expect one row, the anchor href, `NO_GO` in the lead, and no `recommendedFirst`.

## Tests

From `archlucid-ui`:

`npx vitest run src/lib/product-line/securenow-first-useful-answer-home-copy.test.ts src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.securenow.test.tsx`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add a row to `SECURENOW_FIRST_HOUR_HOME_ROWS`.
- Do not commit.

## Done when

Home shows **First useful answer** under **Start here**, with one link to `#first-useful-answer`, and **Start here** still has five rows.
