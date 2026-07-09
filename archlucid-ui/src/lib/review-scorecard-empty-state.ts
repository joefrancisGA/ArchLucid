export const REVIEW_SCORECARD_EMPTY_HEADING = "No committed reviews yet";

export const REVIEW_SCORECARD_EMPTY_DESCRIPTION =
  "Finalize a review package to populate scorecard metrics, governance outcomes, findings, and ROI estimates.";

export const REVIEW_SCORECARD_EMPTY_PRIMARY_CTA = "Create review package";
export const REVIEW_SCORECARD_EMPTY_PRIMARY_HREF = "/reviews/new";

export const REVIEW_SCORECARD_EMPTY_SECONDARY_CTA = "Open review packages";
export const REVIEW_SCORECARD_EMPTY_SECONDARY_HREF = "/reviews";

export const REVIEW_SCORECARD_EMPTY_TERTIARY_CTA = "View sample scorecard";

export const REVIEW_SCORECARD_EMPTY_PREVIEW_SECTION_TITLE = "What this scorecard will show";

export const REVIEW_SCORECARD_EMPTY_PREVIEW_ITEMS = [
  "Finalized review packages",
  "Affirmed findings",
  "Governance approvals",
  "Average review cycle time",
  "Estimated review-time savings",
  "ROI readiness",
] as const;

export const REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE =
  "Scorecard metrics appear after at least one review package is finalized.";

export const REVIEW_SCORECARD_SAMPLE_QUERY_PARAM = "sample";

export const REVIEW_SCORECARD_SAMPLE_HREF = "/scorecard?sample=1";

export const REVIEW_SCORECARD_SAMPLE_BANNER_COPY =
  "Sample scorecard — illustrative metrics for evaluation. ROI assumptions are read-only in sample mode.";

export function isReviewScorecardSampleMode(searchParams: URLSearchParams | null | undefined): boolean {
  return searchParams?.get(REVIEW_SCORECARD_SAMPLE_QUERY_PARAM) === "1";
}

export function buildReviewScorecardSampleHref(): string {
  return REVIEW_SCORECARD_SAMPLE_HREF;
}
