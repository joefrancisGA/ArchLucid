# SN-LIFT-11 — Link the sponsor readout outline

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

Sponsor Home links the stage-6 readout outline.

## Why

The readout outline is a markdown file. The sponsor section does not name it.

## Read first

- `docs/securenow/SPONSOR_READOUT_OUTLINE.md`
- `archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts`

## What to build

1. Branch `sn-lift/11-sponsor-readout` from current `master` after SN-LIFT-10.
2. Add one sponsor Home row:
   - label `Readout outline`
   - href `https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/SPONSOR_READOUT_OUTLINE.md`
   - summary `Stage 6 facilitation. Not an approved offer and not customer evidence.`
3. Do not set `recommendedFirst`.
4. Update the sponsor home copy test.

## Tests

From `archlucid-ui`: `npx vitest run src/lib/product-line/securenow-sponsor-home-copy.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

Sponsor Home includes Readout outline, labeled as not customer evidence.
