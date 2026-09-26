# UU-38 — The filter matched nothing

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-39 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave D (**UU-38**). **Depends on:** the findings queue filter bar.

## Goal

When a findings filter matches nothing, the page says the filter is why the list is empty.

## Why

An active severity or search filter can hide every loaded row. The empty screen then looks like the review has no findings.

## Read first

- `archlucid-ui/src/components/governance/findings/GovernanceFindingsFilterBar.tsx`
- `archlucid-ui/src/components/governance/findings/GovernanceFindingsQueueActiveFilterChips.tsx`
- `archlucid-ui/src/components/governance/findings/use-governance-findings-filter.ts`
- `archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.tsx`

## What to build

1. Branch `uu/38-filter-emptied-the-list` from current `master`.
2. When findings have loaded, at least one filter is active, and the visible set is empty, show: "No findings match this filter."
3. Keep the existing control that clears filters. Do not add a second clear control.
4. When no filter is active and the queue is empty, keep the existing empty state. Do not use the filter sentence.
5. While the queue is loading, do not show the filter sentence.

## Acceptance criteria

- A severity filter that excludes every loaded row shows the filter sentence.
- Clearing the filter removes the sentence and shows the rows again.
- A genuinely empty queue with no filter does not show the filter sentence.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The sentence is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/governance/findings/GovernanceFindingsFilterBar.test.tsx "src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.test.tsx"
```

## Done when

Tests pass. Tell the owner to filter the queue to nothing and read the sentence before clearing it. Wait for that look before any commit.
