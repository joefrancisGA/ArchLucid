# SN-COG-05 — One next action when SecureNow has no remediation waves

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COG prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE66_COMPOSER_PROMPTS.md`

## Goal

On the security product line, an empty remediation-wave list names the next action. The architecture product line keeps its current sentence.

## Why

`REMEDIATION_WAVES_EMPTY_LABEL` is `No remediation waves yet.` and the workbench shares it across product lines. A blank wave list does not say to open a ranked path, and it must not become a clean result.

## Read first

- `archlucid-ui/src/lib/remediation-wave-list-copy.ts`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx` (the empty-wave paragraph and `useProductLine`)
- `.cursor/prompts/securenow-cognitive-load-hold.md`

## What to build

1. Branch `sn-cog/05-waves-empty` from current `master` after SN-COG-04 is present.
2. Add `archlucid-ui/src/lib/product-line/securenow-remediation-waves-empty-copy.ts` exporting `SECURENOW_REMEDIATION_WAVES_EMPTY_LABEL` with this exact text: `No remediation waves yet. Open Priorities & waves and select a ranked path. A blank list is not a clean result.`
3. In `RemediationWorkbenchClient.tsx`, when `productLine === "security"`, render the new constant. Otherwise keep `REMEDIATION_WAVES_EMPTY_LABEL`. Do not change the shared constant. Do not rewrite the workbench.
4. Add a vitest that the SecureNow constant equals that sentence and that `REMEDIATION_WAVES_EMPTY_LABEL` is still `No remediation waves yet.`

## Tests

From `archlucid-ui`:

`npx vitest run src/lib/product-line/securenow-remediation-waves-empty-copy.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not mark a blank list verified.
- Do not commit.

## Done when

SecureNow empty waves name Priorities & waves, and the architecture empty sentence is unchanged.
