# UU-31 — The score is a sort key

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-32 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave D (**UU-31**). **Depends on:** the ranked-path Score column.

## Goal

The ranked-path Score column says the number is a sort key. It does not look like a percentage or a grade.

## Why

The cell shows four decimal places, such as `0.8123`. A reader can treat that as a confidence percent. The number only orders the loaded rows.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsTable.tsx`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx` (the rank line that prints `compositeSortScore`)
- `archlucid-ui/src/lib/security-evidence-path-types.ts` (`compositeSortScore`)

## What to build

1. Branch `uu/31-score-is-sort-key` from current `master`.
2. On the ranked-path table, keep the Score header and the existing number. Add one helper, once, not on every row: "Sort key. Not a percentage."
3. On the path-inspect rank line, keep the number and add the same sentence once beside it.
4. Do not round, hide, or multiply the score. Do not change rank order.

## Acceptance criteria

- The ranked table still shows the existing decimal score.
- The helper appears once on the table and once on the inspect rank line.
- Tests do not expect a percent sign.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The helper text is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx" src/components/security/SecurityEvidencePathInspectPanel.test.tsx
```

## Done when

Tests pass. Tell the owner to read a ranked row and confirm the number is still there and the helper says it is not a percentage. Wait for that look before any commit.
