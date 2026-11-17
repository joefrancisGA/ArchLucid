# SN-ROI-04 — Checker for the SecureNow ROI notes

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ROI prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ROI_COMPOSER_PROMPTS.md`

## Goal

CI fails when the measurement log gains a filled-in saving, the cost card prints a fee, the fixture drops its label, or the executive proof packet starts calculating ROI.

## Why

`scripts/ci/check_securenow_procurement_pack.py` validates the procurement pack. These ROI notes need their own check so a later edit cannot turn a blank log into a customer claim.

## Read first

- `docs/securenow/PILOT_MEASUREMENT_LOG.md`
- `docs/securenow/ROI_COST_INPUT.md`
- `docs/securenow/ROI_FIXTURE_WORKSHEET.md`
- `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md`
- `scripts/ci/check_securenow_compliance_notes.py` (shape only; do not change it)
- `.github/workflows/ci.yml` (step `SecureNow compliance notes unit tests`)

## What to build

1. Branch `sn-roi/04-checker` from current `master` after SN-ROI-01 through SN-ROI-03 are present.
2. Add `scripts/ci/check_securenow_roi_notes.py`.
3. The script exits 1 when any of these fail:
    - `docs/securenow/PILOT_MEASUREMENT_LOG.md` is missing, does not contain `NOT MEASURED`, or has fewer than 3 data rows whose cells include `BLANK`.
    - `docs/securenow/ROI_COST_INPUT.md` is missing, does not link `PRIVATE_PRICE_SHEET.md`, does not contain `SN-ANNUAL`, or contains `$`.
    - `docs/securenow/ROI_FIXTURE_WORKSHEET.md` is missing, does not contain `FIXTURE`, does not contain `-8000`, or does not contain `not a customer result`.
    - `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md` does not contain `ROI not calculated`, or contains fewer than five occurrences of `NOT COLLECTED`.
    - Any of the three new files contains `975%` or `guaranteed ROI`.
4. Add `scripts/ci/test_check_securenow_roi_notes.py` using `unittest`. Cover: the real repository passes; a temp copy that inserts `$` into the cost card fails; a temp copy that removes `ROI not calculated` from the executive template fails.
5. In `.github/workflows/ci.yml`, add a step immediately after `SecureNow compliance notes unit tests`:
    - name: `SecureNow ROI notes`
    - `continue-on-error: true`
    - `run: python scripts/ci/check_securenow_roi_notes.py`
    - And a unittest step for `scripts.ci.test_check_securenow_roi_notes`, also `continue-on-error: true`.
6. Do not change `check_securenow_procurement_pack.py` or `check_securenow_compliance_notes.py`.
7. Do not add these notes to `claims()` in `build_two_product_commercial_workpack.py`.

## Tests

```bash
python3 scripts/ci/check_securenow_roi_notes.py
python3 -m unittest scripts.ci.test_check_securenow_roi_notes
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Leave `continue-on-error: true`. Do not edit branch-protection docs.
- Do not commit.

## Done when

The checker exits 0 on the repository, the two negative tests fail for the right reason, and the executive proof packet still says ROI is not calculated.
