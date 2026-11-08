# SN-COMP-04 — Checker for SecureNow compliance notes

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COMP prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_COMPLIANCE_COMPOSER_PROMPTS.md`

## Goal

CI fails when the responsibility note or the coverage card drops its non-certification language, or when the lineage markdown formatter drops **NOT VERIFIED**.

## Why

`scripts/ci/check_securenow_procurement_pack.py` validates the procurement pack. These compliance notes will rot unless they have their own check. Extending the procurement script would mix questionnaire rows with control-duty copy.

## Read first

- `docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md`
- `docs/securenow/FRAMEWORK_COVERAGE.md`
- `archlucid-ui/src/lib/audit-evidence-control-lineage-markdown.ts` (or the formatter path SN-COMP-03 actually added)
- `scripts/ci/check_securenow_scenario_chooser.py` (shape only; do not change it)
- `.github/workflows/ci.yml` (step `SecureNow scenario chooser unit tests`)

## What to build

1. Branch `sn-comp/04-checker` from current `master` after SN-COMP-01 through SN-COMP-03 are present.
2. Add `scripts/ci/check_securenow_compliance_notes.py`.
3. The script exits 1 when any of these fail:
    - `docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md` is missing.
    - That file has fewer than 6 or more than 8 data rows in its duty table.
    - That file does not contain `Not an ATO` and `NOT VERIFIED`.
    - `docs/securenow/FRAMEWORK_COVERAGE.md` is missing.
    - That file does not contain `Not a certification` and `frameworkMappings`.
    - Either file contains the phrase `SOC 2 certified` or `ISO 27001 certified`.
    - A relative markdown link in either file does not resolve. Ignore `http` links and pure anchors.
    - The lineage markdown formatter source does not contain `NOT VERIFIED`.
4. Add `scripts/ci/test_check_securenow_compliance_notes.py` using `unittest`. Cover: the real repository passes; a temp copy that removes `NOT VERIFIED` from the responsibility note fails; a temp copy that inserts `SOC 2 certified` into the coverage card fails.
5. In `.github/workflows/ci.yml`, add a step immediately after `SecureNow scenario chooser unit tests`:
    - name: `SecureNow compliance notes`
    - `continue-on-error: true`
    - `run: python scripts/ci/check_securenow_compliance_notes.py`
    - And a unittest step for `scripts.ci.test_check_securenow_compliance_notes`, also `continue-on-error: true`.
6. Do not change `check_securenow_procurement_pack.py` or `check_securenow_scenario_chooser.py`.
7. Do not add these notes to `claims()` in `build_two_product_commercial_workpack.py`.

## Tests

```bash
python3 scripts/ci/check_securenow_compliance_notes.py
python3 -m unittest scripts.ci.test_check_securenow_compliance_notes
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Leave `continue-on-error: true`. Do not edit branch-protection docs.
- Do not commit.

## Done when

The checker exits 0 on the repository, the two negative tests fail for the right reason, and the procurement pack checker is unchanged.
