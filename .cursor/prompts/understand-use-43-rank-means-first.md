# UU-43 — Rank 1 is the first path to inspect

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-44 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave E (**UU-43**). **Depends on:** the ranked-path Rank column. If UU-31 has landed, keep "Sort key. Not a percentage."

## Goal

The ranked-path Rank header says that 1 is the first path to inspect.

## Why

The column shows 1, 2, 3 with no statement of whether 1 is best, worst, or only a stored order.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsTable.tsx`

## What to build

1. Branch `uu/43-rank-means-first` from current `master`.
2. On the Rank header, add one helper: "1 is the first path to inspect."
3. Show it once, on the header, not on every row.
4. Do not renumber rows. Do not change rank order. Do not remove the UU-31 score helper if it is present.

## Acceptance criteria

- The header shows the helper once.
- A row whose rank is 1 still shows 1.
- The score helper, if present, is still on the Score header.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The helper is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

## Done when

Tests pass. Tell the owner to read the Rank header before the first row. Wait for that look before any commit.
