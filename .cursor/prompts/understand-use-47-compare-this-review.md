# UU-47 — Compare this review

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-48 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave E (**UU-47**). **Depends on:** `buildCompareTwoReviewsHref` and `alt+c`. If UU-24 has landed, keep Reviewed, Sharing, and Send.

## Goal

A sealed review shows the existing compare link with the package actions, and shows `alt+c`.

## Why

Compare already exists on the retention rail and as `alt+c`. The package actions do not show it, so the reader does not see how to compare this review with another.

## Read first

- `archlucid-ui/src/components/PostCommitRetentionRail.tsx`
- `archlucid-ui/src/lib/compare-two-reviews-route.ts` (`buildCompareTwoReviewsHref`)
- `archlucid-ui/src/lib/shortcut-registry.ts` (`REVIEW_DETAIL_PAGE_SHORTCUTS`, `alt+c`)
- `archlucid-ui/src/components/ShortcutHint.tsx`
- The sealed package action row in `ReviewPackageDoThisNextStrip.tsx`

## What to build

1. Branch `uu/47-compare-this-review` from current `master`.
2. On a sealed review, in the package action row, add a link labeled "Compare this review" that uses `buildCompareTwoReviewsHref` for the current review.
3. Show `ShortcutHint` for `alt+c` beside that link.
4. If that same href is already in the action row, do not add a second link.
5. Do not add a compare page, a compare API, or a new shortcut. Do not show the link on an unsealed review.
6. Do not hide a review workspace tab.

## Acceptance criteria

- A sealed review action row shows "Compare this review" and `alt+c`.
- The href is the existing compare route for that review.
- An unsealed review does not show the link.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- The link label is exact. The link is not a filled primary button.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/architecture/reviews/[reviewId]/_sections/ReviewPackageDoThisNextStrip.test.tsx" src/components/PostCommitRetentionRail.test.tsx
```

Add a sealed-package test if the strip suite does not cover compare. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to open a sealed review and read Compare this review before using it. Wait for that look before any commit.
