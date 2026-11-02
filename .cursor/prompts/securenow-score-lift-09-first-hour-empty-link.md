# SN-LIFT-09 — Point the empty collection line at the first hour

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

The empty-collection recovery line also names the first-hour page.

## Why

Adoption Friction is 68 (weight 6). Collection is locked to `/integrations/cloud-connections`. The first-hour page is the place that explains what to do after it connects.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts`
- `docs/securenow/FIRST_HOUR.md`

## What to build

1. Branch `sn-lift/09-first-hour-empty-link` from current `master`.
2. Find the SecureNow empty-collection sentence that already links `/integrations/cloud-connections`. Add a second link labeled `First hour` to `/administration/securenow-first-hour` in that same empty state. Keep the collection link.
3. Do not change the five Start here rows or their order.
4. Do not add a duration or an SLA.
5. Update the test that already asserts the collection href so it also asserts the first-hour href.

## Tests

From `archlucid-ui`: run the existing SecureNow empty-collection test.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

The empty collection state links both collection and the first hour.
