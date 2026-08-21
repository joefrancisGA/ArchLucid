import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH } from "@/lib/sponsor-report-navigation";

export const REVIEW_SCORECARD_EMPTY_HEADING = "No finalized reviews yet";

export const REVIEW_SCORECARD_EMPTY_DESCRIPTION =
  "Finalize a review to populate scorecard metrics, governance outcomes, findings, and ROI estimates.";

export const REVIEW_SCORECARD_EMPTY_PRIMARY_CTA = BUYER_START_ARCHITECTURE_REVIEW_CTA;
export const REVIEW_SCORECARD_EMPTY_PRIMARY_HREF = "/architecture/reviews/new";

export const REVIEW_SCORECARD_EMPTY_SECONDARY_CTA = "Open reviews";
export const REVIEW_SCORECARD_EMPTY_SECONDARY_HREF = "/architecture/reviews";

export const REVIEW_SCORECARD_EMPTY_TERTIARY_CTA = "View sample scorecard";

export const REVIEW_SCORECARD_EMPTY_PREVIEW_SECTION_TITLE = "What this scorecard will show";

export const REVIEW_SCORECARD_EMPTY_PREVIEW_ITEMS = [
  "Finalized reviews",
  "Affirmed findings",
  "Resolve outcomes",
  "Average review cycle time",
  "Estimated review-time savings",
  "ROI readiness",
] as const;

export const REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE =
  "Scorecard metrics appear after at least one review is finalized.";

export const REVIEW_SCORECARD_SAMPLE_QUERY_PARAM = "sample";

export const REVIEW_SCORECARD_SAMPLE_HREF =
  `${SPONSOR_REPORT_ARCHITECTURE_SCORECARD_PATH}?${REVIEW_SCORECARD_SAMPLE_QUERY_PARAM}=1`;

export const REVIEW_SCORECARD_SAMPLE_BANNER_COPY =
  "Sample scorecard — illustrative metrics for evaluation. ROI assumptions are read-only in sample mode.";

export function isReviewScorecardSampleMode(searchParams: URLSearchParams | null | undefined): boolean {
  return searchParams?.get(REVIEW_SCORECARD_SAMPLE_QUERY_PARAM) === "1";
}

export function buildReviewScorecardSampleHref(): string {
  return REVIEW_SCORECARD_SAMPLE_HREF;
}
