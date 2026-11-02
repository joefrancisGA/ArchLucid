# SN-LIFT-20 — Keep NOT VERIFIED on the later-capture fixture walk

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

The later-capture fixture walk shows `NOT VERIFIED` as its honest label.

## Why

Correctness is 80 (weight 8). The chooser already says a missing later-capture element is not verified. The operator page from SN-LIFT-01 must not soften that label.

## Read first

- `docs/securenow/SCENARIO_CHOOSER.md`
- `docs/securenow/scenario-packs/later-capture-not-verified.md`

## What to build

1. Branch `sn-lift/20-correctness-not-verified` from current `master` after SN-LIFT-01.
2. In `securenow-scenario-walks-copy.ts`, the `later-capture-not-verified` row label must be the exact text `NOT VERIFIED`.
3. Extend the scenario checker from SN-LIFT-03 so that id's row contains `NOT VERIFIED` and does not contain `verified clean` or `remediation succeeded`.
4. Add a page test assertion for `NOT VERIFIED`.
5. Do not mark a fixture path verified.

## Tests

From `archlucid-ui`: rerun the scenario-walks page test. From the repo root: rerun `python3 scripts/ci/check_securenow_scenario_walks.py`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

The later-capture walk shows `NOT VERIFIED` and the checker rejects a success claim.
