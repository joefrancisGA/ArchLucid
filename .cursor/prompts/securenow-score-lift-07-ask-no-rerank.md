# SN-LIFT-07 — Say Ask does not change the path rank

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

The Environment Ask row says the answer cites a stored path and does not change the rank.

## Why

Cutting-Edge AI Technology is 70 (weight 8). Ask is already on Home. The summary still sounds like a general question box.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-infrastructure-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`

## What to build

1. Branch `sn-lift/07-ask-no-rerank` from current `master`.
2. Replace the Ask row summary with `Explain one stored ranked path. The answer cites collected evidence and does not change the rank.`
3. Add the same limit sentence to the path-inspect explanation leads, model and simulator, if it is not already there: `This does not change the rank.`
4. Update the home copy test and the path-inspect copy test. Do not change the ranker, the topic schema, or `maxTokens`.

## Tests

From `archlucid-ui`: run the existing infrastructure home copy test and the path-inspect copy test. Add a test file if one does not assert the Ask summary.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

Home Ask and both explanation leads say the rank does not change.
