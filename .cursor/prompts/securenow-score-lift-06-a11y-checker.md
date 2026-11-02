# SN-LIFT-06 — Checker requires the new axe cases

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

The accessibility checker fails if the new axe cases disappear.

## Why

SN-LIFT-04 and SN-LIFT-05 can be deleted without a failing check.

## Read first

- `scripts/ci/check_securenow_accessibility.py`
- `scripts/ci/test_check_securenow_accessibility.py`

## What to build

1. Branch `sn-lift/06-a11y-checker` from current `master` after SN-LIFT-05.
2. Require `securenow-accessibility-axe.test.tsx` to contain `SecureNowFirstHourPageView`, `SecureNowComplianceNotesPageView`, `SecureNowSelfServicePageView`, `SecureNowReturnReasonsPageView`, `SecureNowPilotDecisionPageView`, and `SecureNowInvestigationEffortPageView`.
3. Require `ACCESSIBILITY_SCOPE.md` to contain `First hour` and `not a WCAG certification`.
4. Add a negative test that deletes one view name from a temp copy and expects failure.
5. Leave `continue-on-error: true` on the accessibility CI step.

## Tests

From the repo root: `python3 scripts/ci/check_securenow_accessibility.py` and `python3 -m unittest scripts.ci.test_check_securenow_accessibility`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

The checker passes, and a temp file that drops one operator view fails.
