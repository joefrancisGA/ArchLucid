# SN-LIFT-14 — Link a stuck collection to the self-service check

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

The cloud-connections empty or error state links the collection stuck-check.

## Why

Customer Self-Sufficiency is 68 (weight 1). The stuck-check exists at `/administration/securenow-self-service#collection`. Collection itself does not point there.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-self-service-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-self-service/SecureNowSelfServicePageView.tsx`

## What to build

1. Branch `sn-lift/14-collection-stuck-link` from current `master`.
2. On the SecureNow cloud-connections empty or failed state, add a link labeled `Collection check` to `/administration/securenow-self-service#collection`.
3. Keep the existing primary collection action.
4. Do not add a mailbox, a support SLA, or `/administration/support`.
5. Update the test that renders that empty or failed state.

## Tests

From `archlucid-ui`: run the cloud-connections empty or error test that covers the security product line.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

A stuck collection state links the self-service collection check.
