# SN-LIFT-15 — Say Environment collection is Azure

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

The Environment home lead says collection is Azure.

## Why

Interoperability is 70 (weight 2). The product is Azure-only for SecureNow collection. The Environment lead does not say so.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-infrastructure-home-copy.ts`

## What to build

1. Branch `sn-lift/15-azure-only-lead` from current `master`.
2. Extend `SECURENOW_INFRASTRUCTURE_HOME_SECTION_LEAD` with `Collection is Azure Reader inventory or an approved upload.`
3. Do not add AWS or GCP collection buttons.
4. Update the infrastructure home copy test. Assert the lead does not contain `Google Cloud` or `AWS` as a collection target.

## Tests

From `archlucid-ui`: run the SecureNow infrastructure home copy test.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

Environment Home says collection is Azure Reader inventory or an approved upload.
