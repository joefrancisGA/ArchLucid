# FS-17 — Open diagrams on the selected path

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

Diagrams open on the selected path's hops. A separate control shows the rest of the subscription.

## Why

Cognitive Load is **64** (weight 1). The diagram surface still opens on the wider subscription graph.

## Read first

- The diagrams client for `/infrastructure/diagrams`
- `archlucid-ui/src/lib/product-line/securenow-cognitive-load-terminology.test.ts`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (`pathId` query)

## What to build

1. Branch `fresh-score/17-diagram-hops` from current `master`.
2. When the diagrams route has `pathId`, the first render shows only that path's hops and the nodes those hops connect.
3. Add a control, `Show the rest of the subscription`, `data-testid="securenow-diagram-show-subscription"`. Activating it shows the full subscription graph and does not drop `pathId`.
4. With no `pathId`, keep the current full graph and hide the control.
5. Do not remove a diagram tab or move a tab into a More menu.
6. Test the filtered render, the control, and the no-`pathId` render.

## Tests

From `archlucid-ui`, run the diagrams test you extended.

## Done when

A `pathId` opens diagrams on that path's hops, and one control reveals the rest of the subscription.

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
