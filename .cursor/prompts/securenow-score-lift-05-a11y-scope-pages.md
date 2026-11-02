# SN-LIFT-05 — Name the operator pages in the accessibility scope

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

`docs/securenow/ACCESSIBILITY_SCOPE.md` names the operator pages covered by SN-LIFT-04.

## Why

The scope list predates the operator notes pages. A reviewer cannot see that those pages are in the target.

## Read first

- `docs/securenow/ACCESSIBILITY_SCOPE.md`
- `archlucid-ui/src/lib/product-line/securenow-accessibility-copy.ts`

## What to build

1. Branch `sn-lift/05-a11y-scope-pages` from current `master` after SN-LIFT-04.
2. Add a bullet list under Surfaces in scope for First hour, Compliance notes, Self-service, When to come back, Pilot decision, and Investigation effort. Use those visible names.
3. Keep the sentence that this is not a WCAG certification, not a VPAT, and not assistive-technology user testing.
4. On the accessibility operator page, add one sentence: `Operator notes pages are in the same WCAG 2.2 AA target. That target is not a certification.`
5. Extend the page test to find that sentence.

## Tests

From `archlucid-ui`: `npx vitest run src/app/(operator)/administration/securenow-accessibility/SecureNowAccessibilityPageView.test.tsx`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

The scope note and the operator page name the notes pages and still refuse a certification claim.
