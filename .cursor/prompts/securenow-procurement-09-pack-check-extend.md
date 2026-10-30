# SN-PROC-09 — Extend the SecureNow procurement pack checker

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-PROC prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`

## Goal

The existing SecureNow pack checker also fails when the data-processing schedule, subprocessors delta, questionnaire crosswalk, or quote cover is missing, breaks a link, or publishes a price or a forbidden assurance claim.

## Why

`scripts/ci/check_securenow_procurement_pack.py` knows the index, the one-pager, and the overlay. The second-wave files will rot the same way if they stay outside the check. This prompt extends that script. It does not turn the CI step into a required status check.

## Read first

- `scripts/ci/check_securenow_procurement_pack.py`
- `scripts/ci/test_check_securenow_procurement_pack.py`
- `docs/securenow/DATA_PROCESSING_SCHEDULE.md`
- `docs/securenow/SUBPROCESSORS_DELTA.md`
- `docs/securenow/QUESTIONNAIRE_CROSSWALK.md`
- `docs/securenow/QUOTE_COVER.md`
- `.github/workflows/ci.yml` (step `SecureNow procurement pack index`)
- `.github/workflows/commercial-readiness-ten-lane.yml`

## What to build

1. Branch `sn-proc/09-pack-check-extend` from current `master` after SN-PROC-05, SN-PROC-06, SN-PROC-07, and SN-PROC-08 are present.
2. Extend `scripts/ci/check_securenow_procurement_pack.py`. Keep the current index, one-pager, and overlay checks.
3. Also require these files, and run the same relative-link check and the same forbidden-phrase check on each:
    - `docs/securenow/DATA_PROCESSING_SCHEDULE.md`
    - `docs/securenow/SUBPROCESSORS_DELTA.md`
    - `docs/securenow/QUESTIONNAIRE_CROSSWALK.md`
    - `docs/securenow/QUOTE_COVER.md`
4. File-specific checks:
    - Schedule body contains `TO BE NEGOTIATED`, `90 days`, and `0104`.
    - Delta body contains `SUBPROCESSORS.md` and `Not offered`.
    - Crosswalk has at least 24 table data rows and contains `Not a completed SIG`.
    - Quote cover contains `SN-EVAL`, `NOT AN APPROVED`, and `HOLD_NO_PUBLICATION`, and contains no `$`.
5. A `$` anywhere in the four new files fails the check. Do not apply that rule to `PRIVATE_PRICE_SHEET.md`. The private sheet is allowed to contain fees and is not one of the four files.
6. Extend `scripts/ci/test_check_securenow_procurement_pack.py`:
    - The real repository passes.
    - A temp copy that adds `$8,000` to the quote cover fails.
    - A temp copy that drops the crosswalk below 24 data rows fails.
    - Existing tests for the broken link, the bare SOC 2 claim, and the negated SOC 2 line still pass. Update their temp fixtures so the four new files exist and satisfy the new checks.
7. Leave `continue-on-error: true` on the SecureNow steps in `.github/workflows/ci.yml`. The ArchLucid pack step is warn-only. Do not make SecureNow stricter in this prompt. Do not edit branch-protection docs.
8. If `commercial-readiness-ten-lane.yml` already runs `scripts.ci.test_check_securenow_procurement_pack`, leave that entry in place.

## Tests

```bash
python3 scripts/ci/check_securenow_procurement_pack.py
python3 -m unittest scripts.ci.test_check_securenow_procurement_pack
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not change `scripts/ci/check_procurement_pack_index.py`.
- Do not set `continue-on-error` to false.
- Do not commit.

## Done when

The checker exits 0 on the repository, the new unit tests fail on a price leak and on a short crosswalk, and the CI step remains `continue-on-error: true`.
