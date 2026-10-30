# SN-A11Y-04 — Checker for the SecureNow accessibility note

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-A11Y prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ACCESSIBILITY_COMPOSER_PROMPTS.md`

## Goal

CI fails when the scope note drops the WCAG target, the operator page disappears, Home loses the Accessibility link, or the copy claims certification.

## Why

The marketing `/accessibility` page is easy to mistake for SecureNow coverage. These files are the SecureNow substitute. A later edit can delete the Home link or add "WCAG certified".

## Read first

- `docs/securenow/ACCESSIBILITY_SCOPE.md`
- `archlucid-ui/src/lib/product-line/securenow-accessibility-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts`
- `archlucid-ui/src/accessibility/securenow-accessibility-axe.test.tsx`
- `scripts/ci/check_securenow_marketability.py` (shape only; do not change it)
- `.github/workflows/ci.yml` (step `SecureNow marketability unit tests`)

## What to build

1. Branch `sn-a11y/04-checker` from current `master` after SN-A11Y-01 through SN-A11Y-03 are present.
2. Add `scripts/ci/check_securenow_accessibility.py`.
3. The script exits 1 when any of these fail:
   - `docs/securenow/ACCESSIBILITY_SCOPE.md` is missing, has no `**Scope:**`, lacks `WCAG 2.2`, lacks `accessibility@archlucid.net`, or contains `$`.
   - The scope note or `securenow-accessibility-copy.ts` contains `WCAG certified`, `fully accessible`, or `VPAT complete`.
   - `securenow-accessibility-copy.ts` lacks `WCAG 2.2`, lacks `Report an accessibility barrier`, or lacks `assistive-technology user testing`.
   - `securenow-reviewer-home-copy.ts` lacks `/administration/securenow-accessibility` or lacks the label `Accessibility`.
   - `securenow-marketing-route-policy.ts` lacks `"/accessibility"` in the blocked prefix list.
   - `archlucid-ui/src/accessibility/securenow-accessibility-axe.test.tsx` is missing or does not contain `toHaveNoViolations`.
4. Add `scripts/ci/test_check_securenow_accessibility.py` using `unittest`. Cover: the real repository passes; a temp copy that inserts `WCAG certified` into the scope note fails; a temp copy that removes `/administration/securenow-accessibility` from the reviewer copy fails.
5. In `.github/workflows/ci.yml`, add a step immediately after `SecureNow marketability unit tests`:
   - name: `SecureNow accessibility`
   - `continue-on-error: true`
   - `run: python scripts/ci/check_securenow_accessibility.py`
   - And a unittest step for `scripts.ci.test_check_securenow_accessibility`, also `continue-on-error: true`.
6. Do not change `check_securenow_marketability.py`.

## Tests

```bash
python3 scripts/ci/check_securenow_accessibility.py
python3 -m unittest scripts.ci.test_check_securenow_accessibility
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Leave `continue-on-error: true`. Do not edit branch-protection docs.
- Do not commit.

## Done when

The checker exits 0 on the repository, the two negative tests fail for the right reason, and `/accessibility` stays on the blocked marketing prefix list.
