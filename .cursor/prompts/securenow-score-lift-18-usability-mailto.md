# SN-LIFT-18 — Use one SecureNow conversation mailto

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

SecureNow Home and `/why-securenow` use the same conversation mailto.

## Why

Usability is 70 (weight 3). Two intakes for the same conversation are easy to split.

## Read first

- `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts`

## What to build

1. Branch `sn-lift/18-usability-mailto` from current `master`.
2. Confirm `Request a conversation` on SecureNow Home uses `WHY_SECURENOW_CONVERSATION_MAILTO`. If it already does, add a test that the Home href equals that constant and stop any further copy change.
3. If it does not, replace the Home href with that constant.
4. Do not add a second mailbox or a support SLA.

## Tests

From `archlucid-ui`: `npx vitest run src/lib/product-line/securenow-reviewer-home-copy.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

The Home conversation link and the Why page mailto are the same constant.
