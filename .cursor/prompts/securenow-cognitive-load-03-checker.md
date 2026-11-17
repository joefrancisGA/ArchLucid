# SN-COG-03 — Add a warn-only cognitive-load contract checker

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COG prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE64_COMPOSER_PROMPTS.md`

## Goal

Keep the tested SecureNow next-action and terminology contract from drifting back into blank states, contradictory nouns, or unsupported success language.

## Read first

- `scripts/ci/check_securenow_adoption_friction.py`
- `scripts/ci/test_check_securenow_adoption_friction.py`
- `docs/securenow/COGNITIVE_LOAD_TERMINOLOGY.md`
- the files changed by SN-COG-01 and SN-COG-02
- `.github/workflows/ci.yml`

## What to build

1. Branch `sn-cog/03-checker` from current `master` after SN-COG-01 and SN-COG-02 are present.
2. Add `scripts/ci/check_securenow_cognitive_load.py` using the repository checker pattern: `validate(root)` returns error strings and the command exits nonzero only when errors exist.
3. Check that the terminology table contains the seven canonical nouns, that the changed empty or blocked states contain a next-action sentence, and that SecureNow copy does not claim a missing or stale capture is clean, verified, or automatically remediated.
4. Add unit tests for the real tree and at least two negative temporary-tree cases.
5. Add one CI step only if the existing workflow has no suitable SecureNow warn-only checker grouping. Keep the step `continue-on-error: true`; do not create a duplicate job.

## Tests

From the repo root:

`python3 scripts/ci/check_securenow_cognitive_load.py`

`python3 -m unittest scripts.ci.test_check_securenow_cognitive_load`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not turn a warn-only checker into a release gate.
- Do not add a timer, engagement score, email reminder, or customer-retention claim.
- Do not commit.

## Done when

The checker catches regressions in next-action copy, canonical terminology, and evidence-state honesty while remaining warn-only.
