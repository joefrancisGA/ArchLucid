# UU-54 — This rank is the finding queue

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-55 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave F (**UU-54**). **Depends on:** UU-43. Keep the path-list rank helper.

## Goal

The SecureNow finding queue says its rank is not the path list.

## Why

The finding queue and the ranked path table both have a Rank column. Rank 1 on the path list already means the first path to inspect. Rank 1 on the finding queue is a different list.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (the table whose `ariaLabel` is "Remediation priority queue")
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsTable.tsx` (do not change its rank helper)

## What to build

1. Branch `uu/54-finding-queue-rank` from current `master`.
2. On the Rank header of the rendered priority queue inside `RemediationFactoryClient.tsx`, keep the word Rank and add: "This rank is the SecureNow finding queue, not the path list."
3. Do not change the path table helper "1 is the first path to inspect."
4. Do not renumber rows. Do not add a score.
5. Leave `RemediationFactoryPriorityTable.tsx` alone unless you find a render path that already uses it.

## Acceptance criteria

- The finding queue Rank header shows the new sentence.
- The path list still says "1 is the first path to inspect."
- Row order is unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The helper is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to read the finding-queue Rank header, then the path-list Rank header. Wait for that look before any commit.
