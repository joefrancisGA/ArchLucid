# UU-59 — Evidence here is what this review used

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-60 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave F (**UU-59**). **Depends on:** the review workspace Evidence tab.

## Goal

The review Evidence tab says the evidence on that tab is what this review used.

## Why

The tab opens on coverage, counts, and deliverables. A reader can treat it as the live Azure inventory or as a second SecureNow snapshot.

## Read first

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailEvidenceTabPanel.tsx`
- `archlucid-ui/src/lib/review-detail-workspace-tabs.ts` (the Evidence tab label; do not move or hide the tab)

## What to build

1. Branch `uu/59-review-evidence-used` from current `master`.
2. At the top of the Evidence tab body, before the section nav, show: "Evidence here is what this review used."
3. Keep the Evidence tab in the workspace tab strip. Do not rename the tab.
4. Do not change coverage counts, inventory rows, or the scope header's other sentences.

## Acceptance criteria

- The Evidence tab shows the sentence before the section nav.
- The tab is still labeled Evidence and is still in the default strip.
- Evidence item counts are unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The sentence is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailEvidenceTabPanel.test.tsx"
```

## Done when

Tests pass. Tell the owner to open a review's Evidence tab and read the sentence before the coverage header. Wait for that look before any commit.
