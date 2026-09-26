# UU-12 — Scope line above SecureNow results

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-13 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave B (**UU-12**). **Depends on:** scope labels the remediation factory and path inspect already load.

## Goal

A SecureNow path result shows the snapshot scope above the rows: subscription, resource group, and snapshot, using labels the page already has.

## Why

A ranked path is hard to trust when the reader cannot see which subscription and snapshot it came from. Those facts often sit in a picker or a query string instead of next to the result.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsTable.tsx`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`
- The remediation-factory client that passes `scopeLabel`
- `archlucid-ui/src/lib/infra-evidence/format-infra-evidence-snapshot-label.ts`

## What to build

1. Branch `uu/12-scope-breadcrumbs` from current `master`.
2. Above the ranked-path table, and again above path inspect when a path is selected, render one scope line.
3. Include only parts the page already knows. Order: subscription, resource group, snapshot. Separate them with " · ".
4. Use the snapshot display label, not a raw id, when `format-infra-evidence-snapshot-label` can produce one. Keep the raw snapshot id behind the existing identifier disclosure.
5. Omit a part that is missing. Do not render an empty crumb or the word "Unknown".
6. Do not add an API, a collector, or a new scope picker.

## Acceptance criteria

- A page with subscription "Prod", resource group "app-rg", and a snapshot label shows those three in that order.
- A page with only a snapshot label shows only that label.
- Path rank order and hop data are unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- The line is text, not a new navigation trail that hides the workbench.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx" src/components/security/SecurityEvidencePathInspectPanel.test.tsx
```

Add a focused assertion for the scope line. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to select a snapshot and read the scope line before the first path row. Wait for that look before any commit.
