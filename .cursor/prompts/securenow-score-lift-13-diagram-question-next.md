# SN-LIFT-13 — Name the next action on an empty diagram question

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

An empty diagram-question state tells the operator to name the review question.

## Why

Cognitive Load is 68 (weight 1). Question-queue and remediation-wave empties already have a next action. The diagram question empty state is the remaining blank.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-question-queue-empty-copy.ts`
- `docs/securenow/FIRST_USEFUL_ANSWER.md`

## What to build

1. Branch `sn-lift/13-diagram-question-next` from current `master`.
2. Find the SecureNow diagram question list empty state. If it already names a next action, stop.
3. Otherwise set the empty copy to `No diagram question yet. Name the review question, then attach it to one path.`
4. Add a link labeled `First useful answer` to `/administration/securenow-first-hour#first-useful-answer` when that anchor exists. If the anchor does not exist, link `/administration/securenow-first-hour`.
5. Do not hide a diagram tab. Do not add a second question queue.

## Tests

From `archlucid-ui`: run the diagram question empty-state test, or add one assertion if the empty copy is rendered in an existing test.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

The empty diagram question tells the operator to name the review question.
