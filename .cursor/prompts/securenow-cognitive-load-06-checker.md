# SN-COG-06 — Extend the cognitive-load checker for the two empty states

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COG prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE66_COMPOSER_PROMPTS.md`

## Goal

The existing warn-only checker fails if the question-queue empty sentence or the SecureNow wave empty sentence disappears.

## Read first

- `scripts/ci/check_securenow_cognitive_load.py`
- `scripts/ci/test_check_securenow_cognitive_load.py`
- the copy files from SN-COG-04 and SN-COG-05
- `archlucid-ui/src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx`

## What to build

1. Branch `sn-cog/06-checker` from current `master` after SN-COG-05 is present.
2. Extend `validate` to require:
    - `An empty list is not a clean environment.` in `securenow-question-queue-empty-copy.ts`, and a reference to `SECURENOW_QUESTION_QUEUE_EMPTY_FILTER` in `SecureNowQuestionQueue.tsx`
    - `A blank list is not a clean result.` in `securenow-remediation-waves-empty-copy.ts`
    - `productLine === "security"` in `RemediationWorkbenchClient.tsx` together with `SECURENOW_REMEDIATION_WAVES_EMPTY_LABEL`
    - `REMEDIATION_WAVES_EMPTY_LABEL` still defined as `No remediation waves yet.`
3. Add two negative temporary-tree tests, one for each new sentence.
4. Keep the existing canonical-noun checks. Do not add a second CI job. Leave `continue-on-error: true` on the cognitive-load steps.

## Tests

From the repo root:

`python3 scripts/ci/check_securenow_cognitive_load.py`

`python3 -m unittest scripts.ci.test_check_securenow_cognitive_load`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not turn the checker into a release gate.
- Do not commit.

## Done when

The checker passes on trunk and fails when either new empty-state sentence is removed.
