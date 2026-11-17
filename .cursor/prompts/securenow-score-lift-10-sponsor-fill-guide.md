# SN-LIFT-10 — Link the sponsor fill guide from Home

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

The sponsor Home row opens the fill guide instead of the public Why page.

## Why

Sponsor Value Visibility is 68 (weight 4). Executive packet context currently links `/why-securenow`, which is a public pitch, not the fill guide.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts`
- `docs/securenow/EXECUTIVE_PACKET_FILL_GUIDE.md`

## What to build

1. Branch `sn-lift/10-sponsor-fill-guide` from current `master`.
2. Change the `Executive packet context` href to `https://github.com/joefrancisGA/ArchLucid/blob/master/docs/securenow/EXECUTIVE_PACKET_FILL_GUIDE.md`.
3. Set the summary to `Map each packet field to an evidence owner. Leave customer outcomes blank.`
4. Update `securenow-sponsor-home-copy.test.ts`.
5. Do not fill `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.

## Tests

From `archlucid-ui`: `npx vitest run src/lib/product-line/securenow-sponsor-home-copy.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

Sponsor Home opens the fill guide and still says outcomes are blank.
