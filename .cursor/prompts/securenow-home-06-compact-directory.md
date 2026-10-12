# SN-HOME-06 — Compact SecureNow Home directory

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-HOME prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md`

## Goal

The five SecureNow Home groups stay, without a repeated Destination / Summary header on each table. Row summaries use the operator body size.

## Why

Findings, Environment, Remediation, Compliance, and Data sources each render the same two column headers. Those headers do not help a person choose. The summaries sit in table cells that inherit a smaller table size, while the operator body token is 13px (`OPERATOR_TYPOGRAPHY.body` in `design-tokens-shell-typography.ts`). The review asked for about 14–16px. That would fork the operator type scale (TB-119). This session uses the body token and removes the repeated headers. It does not change the scale.

## Read first

- `archlucid-ui/src/components/product-line/SecureNowHomeDestinationSection.tsx`
- `archlucid-ui/src/components/product-line/SecureNowHomeDestinationSection.test.tsx`
- `archlucid-ui/src/lib/design-tokens-shell-typography.ts` (`OPERATOR_TYPE_SCALE.body`)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.tsx` (the single Architecture workbench table)

## What to build

1. Branch `sn-home/06-compact-directory` from current `master`.
2. In `SecureNowHomeDestinationSection`, keep the table and the header cells for screen readers. Hide the header row visually (`sr-only` on the header row, or an equivalent that leaves the headers in the accessibility tree). The five groups no longer show "Destination" and "Summary" on screen.
3. The summary cell uses `OPERATOR_TYPOGRAPHY.body`. Do not add `text-[14px]`, `text-[15px]`, or `text-[16px]`.
4. Section heading and the one-sentence lead stay. Do not remove a group. Do not merge the five groups into one table.
5. The Architecture infrastructure overview keeps its visible Workbench / Summary header. That page has one table.
6. Do not add cards, and do not add a row of three extra actions above the directory.

## Tests

1. A SecureNow destination section still exposes "Destination" and "Summary" to `getByRole("columnheader")` (or the table's accessible header names), and those header cells are visually hidden.
2. The summary text node has the body token class from `OPERATOR_TYPOGRAPHY.body`.
3. Five section headings still render on SecureNow Home.
4. The Architecture overview table still shows a visible "Workbench" header.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- No new API, no new package.
- Do not edit `OPERATOR_TYPE_SCALE`.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

SecureNow Home groups read as labeled lists. The column titles remain for assistive tech and stay off the visual page. Summaries use the 13px body token.
