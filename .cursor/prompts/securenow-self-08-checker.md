# SN-SELF-08 — Checker covers anchors, Home rows, and the second link

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-SELF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SELF_SUFFICIENCY_COMPOSER_PROMPTS.md`

## Goal

The warn-only self-service checker requires the four anchors, the four Home hrefs, and the remediation-tracker link.

## Read first

- `scripts/ci/check_securenow_self_service.py`
- `scripts/ci/test_check_securenow_self_service.py`
- the files changed by SN-SELF-05 through SN-SELF-07

## What to build

1. Branch `sn-self/08-checker` from current `master` after SN-SELF-07 is present.
2. Extend `validate` to require:
    - ids `collection`, `connector`, `ranking`, and `email` in `SecureNowSelfServicePageView.tsx`
    - the four hash hrefs in `securenow-self-service-home-copy.ts`
    - `Open remediation tracker` in the page
    - `SECURENOW_REMEDIATION_INSTANCES_PATH` still present in the copy module
3. Keep the existing rejects for `recommendedFirst: true`, `$`, and `Start trial`, and the rule that `/administration/support` stays architecture-only.
4. Add one negative temporary-tree test that removes `#ranking` from the Home copy.
5. Leave the existing CI steps on `continue-on-error: true`.

## Tests

From the repo root:

`python3 scripts/ci/check_securenow_self_service.py`

`python3 -m unittest scripts.ci.test_check_securenow_self_service`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not set `continue-on-error` to false.
- Do not commit.

## Done when

The checker passes on trunk and fails when the ranking Home anchor is removed.
