# SN-SELF-07 — Two links on the ranking check

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-SELF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SELF_SUFFICIENCY_COMPOSER_PROMPTS.md`

## Goal

The ranking situation opens Priorities & waves and the remediation tracker as two named links.

## Why

The step body mentions both `/security/remediation-factory` and `/security/remediation-instances`, and the page renders only the factory link. The second path is easy to miss.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-self-service-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-self-service/SecureNowSelfServicePageView.tsx`
- `archlucid-ui/src/app/(operator)/administration/securenow-self-service/SecureNowSelfServicePageView.test.tsx`

## What to build

1. Branch `sn-self/07-second-link` from current `master` after SN-SELF-06 is present.
2. On the step whose title is `No ranked path, or not verified`, add `secondaryHref` set to `SECURENOW_REMEDIATION_INSTANCES_PATH`. Keep `href` as `SECURENOW_REMEDIATION_FACTORY_PATH`.
3. For that step only, render two links:
    - `Open Priorities & waves` → the factory path
    - `Open remediation tracker` → the instances path
4. Other steps keep the label `Open in product`. The email step keeps `Email support`.
5. Update the page test for both names and both hrefs on `#ranking`.

## Tests

From `archlucid-ui`:

`npx vitest run src/app/(operator)/administration/securenow-self-service/SecureNowSelfServicePageView.test.tsx src/lib/product-line/securenow-self-service-copy.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not say SecureNow changes Azure.
- Do not commit.

## Done when

The ranking check has two distinctly named links, and the other checks keep their current labels.
