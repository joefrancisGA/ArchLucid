# UU-34 — When these ranked paths were computed

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-35 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave D (**UU-34**). **Depends on:** `computedUtc` already on each ranked-path row.

## Goal

The ranked-path list says when the loaded rows were computed.

## Why

A path list can look current when the evidence is from an older inventory pass. The row already carries `computedUtc`. The table does not say it.

## Read first

- `archlucid-ui/src/lib/security-evidence-path-types.ts` (`computedUtc` on `SecurityEvidencePathRankSummary`)
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx`
- `archlucid-ui/src/lib/format-iso-utc.ts`

## What to build

1. Branch `uu/34-ranked-path-time` from current `master`.
2. Above the ranked-path table, when every loaded row shares one `computedUtc`, show: "Computed {time}." Use the existing UTC display helper.
3. When loaded rows have more than one `computedUtc`, show: "Computed times differ across this page."
4. While the query is loading, or when no row has a time, omit the line. Do not show a guessed time.
5. Do not add a snapshot picker and do not call Azure.

## Acceptance criteria

- Ten rows with the same `computedUtc` produce one "Computed" line.
- Two different times produce the differ sentence.
- Loading does not show either sentence.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- The line uses "Computed". It does not say the diagram is an observed fact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

## Done when

Tests pass. Tell the owner to read the computed line before the first ranked row. Wait for that look before any commit.
