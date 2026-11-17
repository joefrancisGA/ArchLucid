# SN-TTV-04 — Warn-only checker for the first useful answer

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-TTV prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE66_COMPOSER_PROMPTS.md`

## Goal

Keep the first-useful-answer note, the first-hour section, and the Home row from drifting into a timer or a clean-bill claim.

## Read first

- `scripts/ci/check_securenow_cognitive_load.py`
- `scripts/ci/test_check_securenow_cognitive_load.py`
- `.github/workflows/ci.yml` (the SecureNow cognitive-load steps)
- the files added by SN-TTV-01 through SN-TTV-03

## What to build

1. Branch `sn-ttv/04-checker` from current `master` after SN-TTV-03 is present.
2. Add `scripts/ci/check_securenow_time_to_value.py`. `validate(root)` returns error strings. Exit 0 when the list is empty.
3. Require these tokens in `docs/securenow/FIRST_USEFUL_ANSWER.md`: `NO_GO`, `Path inspect`, `/infrastructure/diagrams`, `/security/remediation-factory`, `missing or stale capture`.
4. Require the phrase `not a timed SLA` in the note. Reject `minutes to value`, `$`, and `Start trial`. Do not treat the substring `timed SLA` inside `not a timed SLA` as a failure.
5. Require `id="first-useful-answer"` on the first-hour page, `/infrastructure/diagrams` on step 4 in `securenow-first-hour-copy.ts`, and the Home anchor `/administration/securenow-first-hour#first-useful-answer`.
6. Reject `recommendedFirst: true` in `securenow-first-useful-answer-home-copy.ts`.
7. Add `scripts/ci/test_check_securenow_time_to_value.py` with the real tree and at least two temporary-tree failures: a missing diagrams path, and a `minutes to value` phrase inserted into the note.
8. In `.github/workflows/ci.yml`, add two steps after the SecureNow cognitive-load unit tests: run the script, then `python -m unittest scripts.ci.test_check_securenow_time_to_value`. Both steps use `continue-on-error: true`.

## Tests

From the repo root:

`python3 scripts/ci/check_securenow_time_to_value.py`

`python3 -m unittest scripts.ci.test_check_securenow_time_to_value`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not set `continue-on-error` to false.
- Do not commit.

## Done when

The checker passes on the real tree, fails the two negative fixtures, and CI runs it as warn-only.
