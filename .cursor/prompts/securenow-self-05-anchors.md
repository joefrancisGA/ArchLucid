# SN-SELF-05 — Anchor the four stuck situations

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-SELF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SELF_SUFFICIENCY_COMPOSER_PROMPTS.md`

## Goal

Each stuck situation on `/administration/securenow-self-service` has a stable anchor.

## Why

Customer Self-Sufficiency is **66** (weight 1). **SN-SELF-01–04** shipped the note, one Home link, the page, and the checker. Home points at the page, not at the matching situation. The owner check is **M-315**. This prompt only adds anchors.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-self-service-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-self-service/SecureNowSelfServicePageView.tsx`
- `archlucid-ui/src/app/(operator)/administration/securenow-self-service/SecureNowSelfServicePageView.test.tsx`
- `.cursor/prompts/securenow-self-hold.md`

## What to build

1. Branch `sn-self/05-anchors` from current `master`. Do not redo SN-SELF-01–04.
2. Add an `id` on each step in the copy module, in order: `collection`, `connector`, `ranking`, `email`.
3. Set that `id` on the matching `<li>` in `SecureNowSelfServicePageView.tsx`.
4. Update the page test so `document.getElementById` finds all four ids and the titles are unchanged.

## Tests

From `archlucid-ui`:

`npx vitest run src/app/(operator)/administration/securenow-self-service/SecureNowSelfServicePageView.test.tsx`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add a mailbox, an SLA, or `/administration/support` on the security line.
- Do not commit.

## Done when

The four situation titles resolve at `#collection`, `#connector`, `#ranking`, and `#email`.
