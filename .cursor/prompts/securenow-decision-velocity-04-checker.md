# SN-DV-04 — Extend the decision-velocity checker

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-DV prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_DECISION_VELOCITY_COMPOSER_PROMPTS.md`

## Goal

The existing warn-only checker also guards the cycle log, the sponsor row, and the operator section. It stays warn-only.

## Why

SN-DV-01 through SN-DV-03 are easy to regress into a filled customer result, a dollar claim, or a second timer that overwrites the ROI log.

## Read first

- `scripts/ci/check_securenow_decision_velocity.py`
- `scripts/ci/test_check_securenow_decision_velocity.py`
- `docs/securenow/DECISION_CYCLE_LOG.md`
- `archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx`
- `.github/workflows/ci.yml` (steps `SecureNow decision velocity` and `SecureNow decision velocity unit tests`)

## What to build

1. Branch `sn-dv/04-checker` from current `master` after SN-DV-01 through SN-DV-03 are present.
2. Extend `scripts/ci/check_securenow_decision_velocity.py`. Keep every current check. Add failures when:
   - `docs/securenow/DECISION_CYCLE_LOG.md` lacks `NO_GO`, `SYNTHETIC FIXTURE`, `BLANK`, `Qualify started (UTC)`, `Stall step`, `Qualify`, `Scope`, `Review`, `Decide change`, `Verify`, `Close`, `Proceed to commercial discussion`, `Extend with bounded scope`, or `Stop`.
   - That file contains `$`, `guaranteed savings`, or a selected markdown checkbox `- [x]`.
   - `securenow-sponsor-home-copy.ts` lacks `Decision cycle` and `/administration/securenow-pilot-decision#decision-cycle`.
   - `SecureNowPilotDecisionPageView.tsx` lacks `id="decision-cycle"` and `securenow-decision-cycle`.
3. Extend `scripts/ci/test_check_securenow_decision_velocity.py`. The real tree passes. A temp copy with `$` in `DECISION_CYCLE_LOG.md` fails. A temp copy that deletes `SYNTHETIC FIXTURE` fails.
4. Leave the existing CI steps in place. Do not add a second workflow job. Both steps stay `continue-on-error: true`.

## Tests

From the repo root:

`python3 scripts/ci/check_securenow_decision_velocity.py`

`python3 -m unittest scripts.ci.test_check_securenow_decision_velocity`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not set `continue-on-error` to false.
- Do not commit.

## Done when

The existing checker passes on the tree that contains the blank log and the operator anchor, and it fails when the log contains `$` or loses `SYNTHETIC FIXTURE`.
