# FS-04 — Show the next first-hour step on Home

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

SecureNow Home names one next step from the collection the page already loaded, and that step is the link.

## Why

Time-to-Value is **62** (weight 7). Home lists every Start here row at once. The operator still has to choose the current step.

## Read first

- `archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx`
- `archlucid-ui/src/components/product-line/SecureNowFirstHourHomeSection.tsx`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-snapshot-capture-status.ts`

## What to build

1. Branch `fresh-score/04-home-next-step` from current `master`.
2. Above the Start here table, add one line with `data-testid="securenow-home-next-step"`.
3. Use the snapshot status `SecureNowHomeEnvironmentContext` already resolves:
   - No snapshot, or the status is missing or stale: label `Next: Scope and freshness`, href `/integrations/cloud-connections`.
   - A current snapshot and no selected path in the URL: label `Next: One ranked path`, href `/security/remediation-factory`.
   - A current snapshot and `pathId` is set: label `Next: Stop`, href `/administration/securenow-first-hour#stop`.
4. The line includes `This is not a timed SLA.`
5. Keep the existing Start here rows. Do not remove the first-hour page.
6. Test the three states in `SecureNowHomeEnvironmentContext.test.tsx` or a sibling test. Mock the snapshot query the component already uses.

## Tests

From `archlucid-ui`, run `SecureNowHomeEnvironmentContext.test.tsx`.

## Done when

Home shows one next step for a missing capture, a current capture with no path, and a current capture with `pathId`. The line says it is not a timed SLA.

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
