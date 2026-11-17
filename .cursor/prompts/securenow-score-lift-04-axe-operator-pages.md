# SN-LIFT-04 — Axe the shipped SecureNow operator pages

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

jest-axe covers the shipped SecureNow operator pages that are already on trunk.

## Why

Accessibility is 64 (weight 1). The axe file covers the accessibility page and `/why-securenow` only. The scope lists Home, Path inspect, Question queue, Remediation tracker, Audit evidence, and diagrams.

## Read first

- `archlucid-ui/src/accessibility/securenow-accessibility-axe.test.tsx`
- `docs/securenow/ACCESSIBILITY_SCOPE.md`

## What to build

1. Branch `sn-lift/04-axe-operator-pages` from current `master`.
2. Add one axe test each for these views, rendering the component directly: `SecureNowFirstHourPageView`, `SecureNowComplianceNotesPageView`, `SecureNowSelfServicePageView`, `SecureNowReturnReasonsPageView`, `SecureNowPilotDecisionPageView`, and `SecureNowInvestigationEffortPageView`.
3. Each test expects `toHaveNoViolations`.
4. Fix only violations that the new render exposes. Do not restyle unrelated pages. Do not hide a review-workspace tab.
5. Do not add a marketing route.

## Tests

From `archlucid-ui`: `npx vitest run src/accessibility/securenow-accessibility-axe.test.tsx`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

Those six operator views have no axe violations, and the existing two tests still pass.
