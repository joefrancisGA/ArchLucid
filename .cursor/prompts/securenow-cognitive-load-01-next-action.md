# SN-COG-01 — Give SecureNow empty states one safe next action

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COG prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE64_COMPOSER_PROMPTS.md`

## Goal

Reduce first-review cognitive load by making each SecureNow Home empty or blocked state answer one question: what can the operator safely do next?

## Read first

- `archlucid-ui/src/components/product-line/SecureNowHomeWorkSummary.tsx`
- `archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`
- the focused tests for those components

## What to build

1. Branch `sn-cog/01-next-action` from current `master`.
2. Inventory the empty, blocked, stale, and not-yet-collected states rendered by the listed SecureNow Home components.
3. For every state that currently leaves the operator without a safe next action, add one short sentence and, where an existing route already exists, one link to that route. Reuse existing product vocabulary and route constants.
4. Keep missing collection visibly missing. Do not turn blank, stale, or blocked evidence into a success state.
5. Do not add a wizard, timer, SLA, auto-apply remediation, new route, or second navigation rail.
6. Add or update focused tests for each changed state. Do not change the Home section chrome or hide sections behind More.

## Tests

From `archlucid-ui`:

`npx vitest run src/components/product-line/SecureNowHomeWorkSummary.test.tsx src/components/product-line/SecureNowHomeEnvironmentContext.test.tsx`

If a listed component has no test file, use the nearest existing focused Home test and explain the choice in the final response.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit the adoption Home rows shipped by SN-ADOPT-05–08 unless a test exposes a regression.
- Do not commit.

## Done when

Every changed empty or blocked state has one honest next action, the collection gap remains visible, and focused tests pass.
