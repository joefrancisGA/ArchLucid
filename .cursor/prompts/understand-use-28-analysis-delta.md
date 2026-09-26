# UU-28 — What this analysis added

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-29 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave C (**UU-28**). **Depends on:** finding counts the review activity or findings tab already has.

## Goal

The review activity surface says how many findings this analysis added, using a count the page already loaded.

## Why

Activity can be a list of events. The question after analysis is whether the review now has findings, and how many, not which internal event name fired.

## Read first

- `archlucid-ui/src/lib/review-detail-workspace-tabs.ts` (the Activity tab stays)
- The activity panel for a review. Search `RunDetail` for the activity tab body.
- The findings count already passed into the review workspace summary.

## What to build

1. Branch `uu/28-analysis-delta` from current `master`.
2. At the top of the activity tab, add one sentence:
   - When the loaded findings count is greater than zero: "This analysis added {count} findings."
   - When the count is zero: "This analysis added no findings."
3. Use the count the workspace already has. Do not add an API to diff a previous analysis.
4. If the page cannot tell the count, omit the sentence. Do not show a guessed number.
5. Do not add a tab. Do not move Activity into More.

## Acceptance criteria

- A review whose loaded findings count is 3 shows "This analysis added 3 findings."
- A review whose count is 0 shows the empty sentence.
- The activity event list still renders under the sentence.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- The sentence uses "findings" and "analysis". It does not say "run".
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome.test.tsx"
```

Add an activity-lead test if that file does not render the activity panel. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to finish an analysis and read the activity lead. Wait for that look before any commit.
