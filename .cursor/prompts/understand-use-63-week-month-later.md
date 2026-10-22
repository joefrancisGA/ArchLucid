# UU-63 — This week, this month, or later

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-64 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave G (**UU-63**). **Depends on:** the existing finding-queue rank. Keep that rank number.

## Goal

Each finding-queue row says whether it falls in this week, this month, or later. The words follow the existing rank. They are not a new score.

## Why

A rank number tells order. It does not tell a reader which batch to pick up. The cutoffs match sizes the wave model already suggests (5 and 25). They are a reading of position, not a second formula on `totalScore`.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryPriorityTable.tsx`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (the rendered priority queue and the UU-54 rank helper)

## What to build

1. Branch `uu/63-week-month-later` from current `master`.
2. Add a When column on the finding priority queue.
3. Use `rankOrder` when the row has it. Otherwise use the 1-based index already used for Rank.
4. Map that number:
   - 1 through 5: "This week"
   - 6 through 25: "This month"
   - 26 and above: "Later"
5. One helper on the When header: "This week, this month, or later follows the queue order. It is not a separate score."
6. Keep the Rank column and the UU-54 helper. Do not compute the band from `totalScore`. Do not rename a remediation wave.

## Acceptance criteria

- Rank 1 shows "This week". Rank 6 shows "This month". Rank 26 shows "Later".
- The helper is present once.
- No row multiplies or buckets `totalScore`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The three labels and the helper are the exact strings.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

Add a unit test for the three cutoffs beside the helper.

## Done when

Tests pass. Tell the owner to read ranks 1, 6, and a later row if one is loaded. Wait for that look before any commit.
