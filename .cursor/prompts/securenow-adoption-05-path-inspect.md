# SN-ADOPT-05 — Name Path inspect on the first hour

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ADOPT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ADOPTION_FRICTION_COMPOSER_PROMPTS.md`

## Goal

The first-hour note and the operator page say that the cut point is read in Path inspect after a person selects a ranked row. Step 3 is not a second link to the same Priorities & waves list.

## Why

Adoption Friction is **64** (weight 6). Steps 2 and 3 in `securenow-first-hour-copy.ts` both open `/security/remediation-factory`. Path inspect is a panel on a selected row. The empty hint already says to select a priority row.

## Read first

- `docs/securenow/FIRST_HOUR.md`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx`
- `archlucid-ui/src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.test.tsx`
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts` (`SECURENOW_PATH_INSPECT_SELECT_FINDING_HINT`; do not edit it)

## What to build

1. Branch `sn-adopt/05-path-inspect` from current `master`.
2. In `FIRST_HOUR.md`, keep the four steps. In the step 3 "Where in the product" cell, say Path inspect is the panel after the person selects one ranked row from step 2. Include the words `Path inspect` and `Select a priority row`. Do not add a second link to `/security/remediation-factory` in that cell.
3. In `securenow-first-hour-copy.ts`:
   - Step 2 keeps `href` `/security/remediation-factory` (use `SECURENOW_REMEDIATION_FACTORY_PATH`).
   - Step 3 title stays `3 — Advisory cut point`.
   - Step 3 body includes `Path inspect` and `Select a priority row`. State that the panel shows the cut point and that SecureNow does not change Azure.
   - Remove `href` from step 3. The page must not render `Open in product` for step 3.
   - Step 4 still has no `href`.
4. On `SecureNowFirstHourPageView.tsx`, add `id="path-inspect"` on the step 3 item and `id="stop"` on the step 4 item.
5. Update the page test. Step 2 still has an `Open in product` link to the factory path. Step 3 text includes `Path inspect` and `Select a priority row`. The page has one `Open in product` link to the factory path, not two.

## Tests

From `archlucid-ui`:

`npx vitest run src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.test.tsx`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add a route for Path inspect.
- Do not add a wizard, a timer, or an auto-apply control.
- Do not commit.

## Done when

Step 3 names Path inspect and the select-a-row hint, and the operator page no longer offers a second factory link for that step.
