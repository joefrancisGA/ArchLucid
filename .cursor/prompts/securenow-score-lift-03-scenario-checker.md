# SN-LIFT-03 — Checker for fixture-walk honesty

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

A warn-only checker keeps the fixture-walk page from claiming customer evidence.

## Why

The page can drift into proof language. The existing scenario checker covers the markdown chooser, not the new page.

## Read first

- `scripts/ci/check_securenow_commercial_packaging.py`
- `.github/workflows/ci.yml`

## What to build

1. Branch `sn-lift/03-scenario-checker` from current `master` after SN-LIFT-02.
2. Add `scripts/ci/check_securenow_scenario_walks.py` and `scripts/ci/test_check_securenow_scenario_walks.py`.
3. Require the copy module to contain the five scenario ids, `Not customer evidence`, `NO_GO`, and `not a starter proof pack`.
4. Reject `$`, `customer outcome`, `READY_TO_PUBLISH`, and `starter-proof-packs`.
5. Require the home copy to contain `/administration/securenow-scenario-walks`.
6. Add a CI step beside the other SecureNow warn-only checkers with `continue-on-error: true`.
7. Add a negative test that appends `$100` in a temp directory and expects failure.

## Tests

From the repo root: `python3 scripts/ci/check_securenow_scenario_walks.py` and `python3 -m unittest scripts.ci.test_check_securenow_scenario_walks`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

The checker passes on the repo and fails when the page copy gains a dollar sign or a customer-outcome claim.
