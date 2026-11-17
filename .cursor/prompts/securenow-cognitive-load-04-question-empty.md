# SN-COG-04 — One next action when no question matches the filter

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COG prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE66_COMPOSER_PROMPTS.md`

## Goal

The question-queue empty filter tells the operator what to do next. An empty list stays an empty list.

## Why

Cognitive Load is **66** (weight 1). **SN-COG-01–03** shipped in PR #5893 for Home empty states and seven nouns. The queue on Diagrams still says only `No questions match this filter.`

## Read first

- `archlucid-ui/src/components/infra-evidence/SecureNowQuestionQueue.tsx` (the empty paragraph near the filter miss)
- `archlucid-ui/src/components/infra-evidence/SecureNowQuestionQueue.test.tsx` (the assertion that the empty sentence is present)
- `docs/securenow/COGNITIVE_LOAD_TERMINOLOGY.md`
- `.cursor/prompts/securenow-cognitive-load-hold.md`

## What to build

1. Branch `sn-cog/04-question-empty` from current `master`. Do not redo SN-COG-01–03.
2. Add `archlucid-ui/src/lib/product-line/securenow-question-queue-empty-copy.ts` exporting `SECURENOW_QUESTION_QUEUE_EMPTY_FILTER` with this exact text: `No questions match this filter. Clear the filter, or open a diagram subscription that has a capture. An empty list is not a clean environment.`
3. Use that constant in the empty paragraph in `SecureNowQuestionQueue.tsx`. Do not refactor the queue.
4. Update the test that expects the old sentence to be present so it expects the new sentence. Leave assertions that only check the old sentence is absent.
5. Add a one-line vitest that the constant equals that sentence.

## Tests

From `archlucid-ui`:

`npx vitest run src/components/infra-evidence/SecureNowQuestionQueue.test.tsx src/lib/product-line/securenow-question-queue-empty-copy.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not rename API fields, route segments, or persisted names.
- Do not add a wizard or hide a review tab.
- Do not commit.

## Done when

A filter miss names the next action and still says the empty list is not a clean environment.
