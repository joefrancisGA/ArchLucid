# SN-SELF-06 — Home rows for the four stuck anchors

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-SELF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SELF_SUFFICIENCY_COMPOSER_PROMPTS.md`

## Goal

SecureNow Home **When you are stuck** links each situation’s anchor. None of the rows is recommended first.

## Why

The page has anchors. Home still has one row to the top of the page, so a stuck operator has to scan all four checks.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-self-service-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-self-service-home-copy.test.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.securenow.test.tsx`
- `scripts/ci/check_securenow_self_service.py` (it requires the operator path string and rejects `recommendedFirst: true`)

## What to build

1. Branch `sn-self/06-home-rows` from current `master` after SN-SELF-05 is present.
2. Replace the single Home row with four rows. Do not set `recommendedFirst`.
    - `Collection missing or stale` → `/administration/securenow-self-service#collection` — summary `A gap is not a clean bill of health.`
    - `Connector will not finish` → `/administration/securenow-self-service#connector` — summary `A failed connector is not a completed capture.`
    - `No ranked path, or not verified` → `/administration/securenow-self-service#ranking` — summary `An empty ranking is not proof you are secure.`
    - `Still stuck` → `/administration/securenow-self-service#email` — summary `Email support@archlucid.net with subject SecureNow. Do not paste secrets.`
3. Keep the lead, including `NO_GO` and `not a support SLA`.
4. Update `securenow-self-service-home-copy.test.ts` for four rows and the four hrefs.
5. Update the Home overview test that expected the unhashed operator path. Assert the `#collection` link. The copy must still contain `/administration/securenow-self-service` so the existing checker keeps passing.

## Tests

From `archlucid-ui`:

`npx vitest run src/lib/product-line/securenow-self-service-home-copy.test.ts src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.securenow.test.tsx`

From the repo root:

`python3 scripts/ci/check_securenow_self_service.py`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not set `recommendedFirst`.
- Do not commit.

## Done when

Home lists the four situations, each href includes its anchor, and no row is recommended first.
