# FS-13 — Record proceed, extend, or stop on the path

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

A person can save one disposition on the open path. The rationale is required. The pilot decision page reads that record.

## Why

Decision Velocity is **62** (weight 2). The decision record is a blank template. The path does not store a human outcome.

## Read first

- `docs/securenow/PILOT_DECISION_RECORD.md`
- `docs/securenow/DECISION_CYCLE_LOG.md`
- `archlucid-ui/src/app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx`
- The sponsor page added by FS-08. If that route is absent, add the disposition control on Path inspect instead, and say so in the session note.

## What to build

1. Branch `fresh-score/13-path-decision` from current `master` after FS-08, or from Path inspect if FS-08 is not on the branch.
2. Persist one choice per `pathId`: Proceed, Extend, or Stop, plus a non-empty rationale. Store it in the browser for this workspace only if no server field exists. Do not add a migration in this session.
3. Reject a save with an empty rationale. The error is `Rationale is required.`
4. The pilot decision page shows the saved path id, the choice, and the rationale. When nothing is saved, it still shows `NOT COLLECTED`.
5. Do not write UTC times into `DECISION_CYCLE_LOG.md`. Do not start a timer.
6. A saved Proceed does not change beta status. Show `Proceed does not clear beta NO_GO.`
7. Test empty rationale, a saved Stop, and the empty pilot page.

## Tests

From `archlucid-ui`, run the pilot decision view test and the new disposition test.

## Done when

A path can store one choice with a rationale, the empty rationale is refused, and the pilot page shows the saved record or `NOT COLLECTED`.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/fresh-score-hold.md` before editing.
- Do not implement another FS prompt in this session.
- Do not commit.
- Beta remains **NO_GO**. Do not publish a fee, a public list price, a CPA SOC 2 report, or a third-party pen-test claim.
- Do not write a customer result, a timed SLA, or a minutes-to-value claim.
- Do not hide review workspace tabs behind a More menu.
- Do not call `PathRankingEngine` or change rank weights.
