# UU-62 — The sort key sits behind the reason

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-63 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave G (**UU-62**). **Depends on:** UU-61. Keep the reader sentence in the summary cell.

## Goal

The priority queue no longer leads with a four-decimal score. The score remains one click away, with the existing sort-key sentence.

## Why

`0.4200` reads as a probability. The number only orders the queue. UU-61 already gives the reason. The score does not need to sit beside that reason.

## Read first

- `archlucid-ui/src/lib/remediation-priority-score-display.ts` (`formatRemediationPrioritySortKeyLine`)
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryPriorityTable.tsx`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (the rendered priority queue)
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsTable.tsx` (do not change the path Score column)

## What to build

1. Branch `uu/62-score-behind-the-reason` from current `master`.
2. On the finding priority queue only, keep the Score header.
3. The closed Score cell text is "Show sort key". Activating it reveals `formatRemediationPrioritySortKeyLine(totalScore)` and nothing else.
4. Use a disclosure button with `aria-expanded`, or the existing URL disclosure pattern already used by the summary cell. Do not invent a second interaction style if that pattern already fits this table.
5. Do not round, multiply, or hide the number from the open disclosure. Do not delete `formatRemediationPrioritySortKeyLine`.
6. Leave the ranked-path Score column and its UU-31 helper untouched.
7. Leave the UU-61 summary sentence untouched.

## Acceptance criteria

- A closed finding row does not show four decimal places in the Score cell.
- Opening the cell shows the existing sort-key sentence, including the four decimals.
- The path table still shows its decimal score.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. "Show sort key" is the exact closed label.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx" src/lib/remediation-priority-score-display.ts
```

If the score display file has no sibling test, run the client test only and add a disclosure test in the client suite.

## Done when

Tests pass. Tell the owner to read a closed finding row, then open Show sort key. Wait for that look before any commit.
