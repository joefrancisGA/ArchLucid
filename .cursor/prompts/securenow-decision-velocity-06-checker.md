# SN-DV-06 — Checker keeps the stall map and the blank log

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-DV prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_DECISION_VELOCITY_COMPOSER_PROMPTS.md`

## Goal

The warn-only decision-velocity checker requires the six stall hrefs and still rejects a filled source log.

## Read first

- `scripts/ci/check_securenow_decision_velocity.py`
- `scripts/ci/test_check_securenow_decision_velocity.py`
- `archlucid-ui/src/lib/product-line/securenow-pilot-decision-copy.ts`
- `docs/securenow/DECISION_CYCLE_LOG.md`

## What to build

1. Branch `sn-dv/06-checker` from current `master` after SN-DV-05 is present.
2. Extend `validate` so `securenow-pilot-decision-copy.ts` must contain these hrefs:
    - `/administration/securenow-first-hour`
    - `/integrations/cloud-connections`
    - `/security/remediation-factory`
    - `/administration/securenow-pilot-decision#securenow-pilot-decision-outcomes-heading`
    - `/security/remediation-instances`
    - `docs/securenow/DECISION_CYCLE_LOG.md` inside the existing GitHub log URL
3. Keep the existing checks that `DECISION_CYCLE_LOG.md` contains `BLANK`, `SYNTHETIC FIXTURE`, and `NO_GO`, and that it does not contain `- [x]` or `$`.
4. Add a negative test that removes `/security/remediation-factory` from a temporary copy of the operator copy and expects an error.
5. Do not change the CI `continue-on-error: true` on the existing decision-velocity steps.

## Tests

From the repo root:

`python3 scripts/ci/check_securenow_decision_velocity.py`

`python3 -m unittest scripts.ci.test_check_securenow_decision_velocity`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not write times into the log.
- Do not commit.

## Done when

The checker passes on trunk and fails when a stall href is removed, while the source log remains blank.
