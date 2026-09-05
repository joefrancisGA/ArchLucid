# HCP-01 — One resume primary on the Reviews hub

**Do not fork LS-08, IS-02, or CD-11.** Working Home already collapses duplicate resume CTAs with `resolveOperatorHomeResumeAffordancePlan`. This file is the leftover on **`/architecture/reviews` (RE)**: the hub Continue strip and the list Continue-last-viewed row can both render as filled primaries for the same package.

## Goal

Reviews hub has **one** filled resume for a given package. If `ReviewsHubContinueReviewStrip` already points at run X, `RunsListContinueLastViewedRow` for X is hidden (or demoted to a text link / `outline`). Header Start vs Continue-draft already uses `resolveReviewsHubHeaderPrimary` / `shouldShowReviewsHubResumeDrafts` — keep that; do not invent a third chooser.

## Why

Home taught that two equally loud Continue buttons are still a chooser. Reviews hub is the inventory sibling of Home. A Working architect scanning packages should not decide between “Continue this review” and “Continue last viewed review” when both name the same run.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/_sections/RunsPageView.tsx` — renders `ReviewsHubContinueReviewStrip`
- `archlucid-ui/src/lib/reviews-hub-continue-review.ts` — `resolveReviewsHubContinueReviewCandidate`
- `archlucid-ui/src/app/(operator)/architecture/reviews/RunsListClient.tsx` — `resolveContinueLastRunsListRow` + `RunsListContinueLastViewedRow`
- `archlucid-ui/src/app/(operator)/architecture/reviews/RunsListContinueLastViewedRow.tsx` — `variant="primary"` Open review
- `archlucid-ui/src/app/(operator)/architecture/reviews/_sections/ReviewsHubContinueReviewStrip.tsx` — `variant="primary"` Continue review
- `archlucid-ui/src/lib/operator/operator-home-resume-affordance.ts` — **reuse this pattern**; extract a shared helper if both Home and hub can import it without a circular import
- `archlucid-ui/src/app/(operator)/architecture/reviews/_sections/reviews-hub-header-primary.ts` — draft continue vs Start; leave unless it fights the package resume

The advanced paginated list (`RunsListClient`) can render on the same page as the hub strip when `totalCount > pageSize` in full shell. Collapse must work in **both** layouts: hub-only (strip + inventory) and hub + advanced list.

## What to build

1. A resolver (prefer generalizing `resolveOperatorHomeResumeAffordancePlan` or a sibling `resolveReviewsHubResumeAffordancePlan`) that takes: continue-strip candidate run id, continue-last-viewed run id. Output: which surface is the filled primary, which is hidden or outline.
2. If both ids are the same, keep the **Continue this review** strip (higher-priority in-flight / awaiting-disposition) and **do not** render `RunsListContinueLastViewedRow`.
3. If they differ, one filled primary (in-flight strip wins over last-viewed). Last-viewed may remain as `outline` / text “Last viewed” — never two `variant="primary"` buttons.
4. Vitest:
   - Same run in strip + last-viewed → one primary, no last-viewed row (or not primary).
   - Different runs → strip primary; last-viewed outline or secondary.
   - No in-flight candidate → last-viewed may be primary (today’s behavior).
   - Header draft-continue tests unchanged.

## Acceptance criteria

- A Working screenshot of `/architecture/reviews` with one in-progress package cannot be read as two start products.
- Draft resume strip still follows `shouldShowReviewsHubResumeDrafts` (hidden when the header already Continues the only draft).
- TB-1539 single-primary-per-hub holds on RE.
- Home LS-08 behavior unchanged.

## Constraints

- Do not delete `RunsListContinueLastViewedRow` from the product — hide/demote when it duplicates the strip.
- Do not fork AD-07 table columns or virtualization.
- Do not collapse review-detail workspace tabs.
- Do not implement **M-90**.
- Do not copy Home’s Your-work rail onto the hub.
