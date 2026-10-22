# UU-02 — Review progress line

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-03 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use (**UU**). **Depends on:** review state the workspace already loads.

## Goal

Until a review is sealed, every review workspace tab shows a five-step line and one sentence naming the unfinished step.

## Why

The first-review guide already teaches a journey, on its own page. Inside the review, the tabs do not say which step is still open.

## Read first

- `archlucid-ui/src/lib/first-review-guide-steps.ts` (leave this page's seven steps in place)
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome.tsx` (`RunDetailWorkspaceHeader`)
- `archlucid-ui/src/components/architecture/ArchitectureCreatedWorkspaceHeader.tsx`
- `archlucid-ui/src/lib/review-detail-workspace-tabs.ts`
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Branch `uu/02-review-progress-line` from current `master`.
2. Add a compact progress line to both review headers. The steps, in order, are Evidence, Analyze, Findings, Decisions, Share.
3. Derive completion from state the page already has. Examples: evidence or intake captured, analysis finished or still running, findings present, a decision recorded, a sealed review record present. When a signal is absent, that step is not started. Do not add an API to invent completion.
4. Under the steps, one sentence names the first unfinished step. Use these sentences:
   - Evidence: "Add evidence before analysis can finish."
   - Analyze: "Analysis is still in progress."
   - Findings: "Review findings before you record decisions."
   - Decisions: "Record decisions before you can finalize."
   - Share: "Finalize to lock the architecture package."
5. Show the line on every tab, including Policies and standards, Architecture, Decisions and remediation, and Finalized review record when those tabs are open. Do not add a tab. Do not move a tab into More. Do not remove a tab from the strip.
6. Hide the line when a sealed review record exists.
7. Do not replace `/architecture/first-review-guide` or `FIRST_REVIEW_GUIDE_STEPS`.

## Acceptance criteria

- An open review shows the five labels and exactly one unfinished-step sentence.
- A sealed review does not show the line.
- Tab ids and tab labels are unchanged.
- Buyer copy says "review" and "finalize". It does not call the review a run.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. Status uses `StatusTag` when a step needs a status chip. Do not tint the whole header.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome.test.tsx"
```

There is no `ArchitectureCreatedWorkspaceHeader.test.tsx` yet. Add one for the progress line and run it. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open an unsealed review, switch across the tab strip, and confirm the same unfinished step stays visible. Then open a sealed review and confirm the line is gone. Wait for that look before any commit.
