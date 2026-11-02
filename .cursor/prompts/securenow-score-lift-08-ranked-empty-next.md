# SN-LIFT-08 — Name the next action when no path is ranked

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

The empty ranked-path state names collection as the next action.

## Why

Time-to-Value is 68 (weight 7). `SECURENOW_PATH_RANKED_PATHS_EMPTY` says there are no paths and does not say what to open.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`

## What to build

1. Branch `sn-lift/08-ranked-empty-next` from current `master`.
2. Change `SECURENOW_PATH_RANKED_PATHS_EMPTY` to `No ranked path for this scope. Open collection, then select a row.`
3. Where that empty string is rendered, add a link labeled `Open collection` to `/integrations/cloud-connections`.
4. Do not add a timer, a minute count, or a new rank.
5. Extend the nearest path-inspect test to find the new sentence and the href.

## Tests

From `archlucid-ui`: run the path-inspect test that renders the empty ranked-path state. If no test renders it, add one assertion beside the existing panel test.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

An empty ranked-path state tells the operator to open collection and links that page.
