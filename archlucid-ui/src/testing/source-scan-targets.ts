import { join } from "node:path";

/**
 * Named source targets for static source-scanning guard tests.
 * When a scanned module moves, update the path here once instead of every consumer test.
 *
 * Paths are relative to the `archlucid-ui` package root (process.cwd() in Vitest).
 */
export const SOURCE_SCAN_TARGETS = {
  "run-detail-page-view":
    "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailPageView.tsx",
  "run-detail-page-view-create-home":
    "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailPageViewCreateHome.tsx",
  "run-detail-page-view-committed":
    "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailPageViewCommitted.tsx",
  "run-detail-tabbed-workspace":
    "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailTabbedWorkspace.tsx",
  "run-detail-page-presentation":
    "src/app/(operator)/architecture/reviews/[reviewId]/_sections/run-detail-page-presentation.ts",
  "run-detail-below-fold":
    "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailBelowFoldSections.tsx",
  "run-detail-operator-technical-disclosure":
    "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailOperatorTechnicalDisclosure.tsx",
  "run-detail-submitted-architecture":
    "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailSubmittedArchitectureSection.tsx",
  "run-detail-workspace-sticky-actions":
    "src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceStickyActions.tsx",
  "sponsor-roi-systemic-issue-trend-chart":
    "src/components/SponsorRoiSystemicIssueTrendChart.tsx",
  "sponsor-roi-summary-section":
    "src/app/(operator)/architecture/sponsor-dashboard/_sections/SponsorRoiSummarySection.tsx",
  "operator-home-page-view": "src/app/(operator)/_sections/OperatorHomePageView.tsx",
  "operator-home-page": "src/app/(operator)/page.tsx",
  "reviews-hub-page": "src/app/(operator)/architecture/reviews/page.tsx",
  "run-detail-page": "src/app/(operator)/architecture/reviews/[reviewId]/page.tsx",
} as const;

export type SourceScanTargetId = keyof typeof SOURCE_SCAN_TARGETS;

/** Absolute path for a registered source-scan target. */
export function resolveSourceScanTargetPath(
  targetId: SourceScanTargetId,
  packageRoot: string = process.cwd(),
): string {
  return join(packageRoot, SOURCE_SCAN_TARGETS[targetId]);
}
