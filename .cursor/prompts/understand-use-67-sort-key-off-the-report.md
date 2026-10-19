# UU-67 — Sort keys stay off the report and the wave list

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not start a new wave in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave H (**UU-67**). **Depends on:** UU-31 and UU-62. Keep "Show sort key" on the operator queues.

## Goal

A person reading the attack path report, or a remediation wave, does not see a sort key. The operator priority queue and the ranked-path queue still open the existing sort-key sentence on demand.

## Why

The four-decimal value only orders a queue. It is not a percentage, a probability, or a live risk score. Report review is findings, evidence, and which findings sit in a wave. Those screens still surface the number: the attack path report reuses the ranked-path Score column, its scope line says "Server rank (composite sort)", and a selected finding prints `formatRemediationPrioritySortKeyLine` in the inspect header with no disclosure. Path inspect already hides the composite key behind "Show sort key". Match that. Do not delete the key.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsTable.tsx` (Score column and `Server rank (composite sort)`)
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.tsx` (the report reuses that table)
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (the ranked-path queue; keep its Score column)
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx` (`InspectSelectionIdentityHeader`, finding branch around the sort-key paragraph)
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationPrioritySortKeyDisclosure.tsx`
- `archlucid-ui/src/lib/remediation-wave-list-copy.ts` and the "Remediation waves" section in `RemediationWorkbenchClient.tsx`

## What to build

1. Branch `uu/67-sort-key-off-the-report` from current `master`.
2. On `RemediationFactoryRankedPathsTable`, add `showSortKeyColumn`, default `true`.
3. When `showSortKeyColumn` is false, omit the Score header and the `SecurityEvidencePathRankSortKeyDisclosure` cell. Replace the scope fragment `Server rank (composite sort)` with `Recorded rank`.
4. The attack path report passes `showSortKeyColumn={false}`. The ranked-path queue in `RemediationFactoryClient` does not pass false.
5. In the finding branch of `InspectSelectionIdentityHeader`, remove the always-visible `formatRemediationPrioritySortKeyLine` paragraph. Render `RemediationPrioritySortKeyDisclosure` there, closed by default. Path inspect already uses `SecurityEvidencePathRankReaderDisclosures`. Leave that disclosure as it is.
6. The wave list stays membership and cap only: "{name}: {memberCount} findings in this wave." and, when present, "Cap {targetSize}." Do not add a score, a sort key, or a Score column. If a wave row already prints one, remove that text only.
7. Do not delete `formatRemediationPrioritySortKeyLine` or `formatSecurityEvidencePathCompositeSortKeyLine`. Do not round, multiply, or change rank order, weights, or wave membership.

## Acceptance criteria

- The attack path report section does not contain "Show sort key", "Sort key", "composite sort", or a four-decimal number.
- The ranked-path queue still shows "Show sort key" and "Sort key. Not a percentage."
- The priority queue still shows "Show sort key" and "Sort key for this queue. Not a percentage."
- A closed finding inspect header does not contain "Sort key" or four decimal places. Opening "Show sort key" shows `Sort key 0.5000. Ordering only — not a percentage, probability, or live risk score.` when `totalScore` is `0.5`.
- A wave named "Wave A" with memberCount 2 and targetSize 5 still shows "Wave A: 2 findings in this wave." and "Cap 5." and does not show "sort key" or a four-decimal number.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. "Show sort key", "Hide sort key", and "Recorded rank" are exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryAttackPathReportSection.test.tsx" "src/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsTable.test.tsx" "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx" "src/components/security/SecurityEvidencePathInspectPanel.test.tsx" "src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.test.tsx"
```

Update those tests to match the acceptance criteria. Do not weaken a test that still expects the operator queue disclosure.

## Done when

Tests pass. Tell the owner to read the attack path report, a closed finding inspect header, and one wave row. Wait for that look before any commit.
