# UU-23 — Path views say how many rows they keep

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-24 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave C (**UU-23**). **Depends on:** the ranked-path view control from UU-16 if it has landed. If it has not, add the count to the existing ranked-path header instead of inventing views.

## Goal

Each path view tells the reader how many loaded rows it keeps.

## Why

Selecting "Privilege paths" changes the table without saying whether the list shrank because nothing matched or because the page is still loading.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsTable.tsx`
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`

## What to build

1. Branch `uu/23-view-counts` from current `master`. If UU-16 is on the branch you are continuing, keep its view query parameter.
2. If named views exist, append the matching count to each view label, using only rows already loaded. Example: "Privilege paths · 4".
3. If named views do not exist, add one line above the table: "Showing {visible} of {loaded} ranked paths."
4. While the query is loading, do not show a zero count. Show the existing loading state.
5. A view that matches nothing keeps the existing empty state and shows "· 0".
6. Do not change rank order or request a new page size to make the count look complete. The count is the loaded page, and the line says so when the server total is larger than the loaded rows.

## Acceptance criteria

- Four privilege rows in a ten-row loaded page produce a privilege count of 4.
- The all-paths count equals the loaded row count.
- Loading does not flash "· 0" before data arrives.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Counts are integers. Do not add a percentage.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

## Done when

Tests pass. Tell the owner to switch views and read the counts before looking at the table. Wait for that look before any commit.
