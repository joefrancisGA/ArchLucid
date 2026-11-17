# SN-COMP-06 — Home row for the compliance notes page

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COMP prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_COMPLIANCE_COMPOSER_PROMPTS.md`

## Goal

SecureNow Home **Compliance** links the operator notes page. Policy packs stay the recommended-first row.

## Why

SN-COMP-05 adds the page. Home still does not point at it.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-compliance-home-copy.ts`
- `archlucid-ui/src/components/product-line/SecureNowComplianceHomeSection.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.securenow.test.tsx`

## What to build

1. Branch `sn-comp/06-home-row` from current `master` after SN-COMP-05 is present.
2. Append one row to `SECURENOW_COMPLIANCE_HOME_ROWS`:
    - `href`: `/administration/securenow-compliance-notes`
    - `label`: `Duty split`
    - `summary`: `Who records disposition, and what this product does not certify.`
    - Do not set `recommendedFirst` on this row. Leave it on the policy-packs row.
3. Update `InfrastructureOverviewClient.securenow.test.tsx` so it finds `securenow-compliance-home-link-/administration/securenow-compliance-notes` with that href. Keep the existing policy-packs assertion.
4. Add or extend a copy test that expects four compliance rows and exactly one `recommendedFirst: true`.

## Tests

From `archlucid-ui`:

`npx vitest run src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.securenow.test.tsx src/lib/product-line/securenow-compliance-home-copy.test.ts`

If the copy test file does not exist, create it.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add a marketing route or a numeric score.
- Do not commit.

## Done when

Home **Compliance** includes **Duty split**, and policy packs remain the only recommended-first compliance row.
