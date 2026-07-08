import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture-workflow-labels";

export const REVIEW_SCORECARD_EMPTY_TITLE = "No committed reviews yet" as const;

export const REVIEW_SCORECARD_EMPTY_DESCRIPTION =
  "Finalize a review package to populate throughput, governance outcomes, findings, and ROI estimates." as const;

export const REVIEW_SCORECARD_EMPTY_PRIMARY_ACTION = BUYER_START_ARCHITECTURE_REVIEW_CTA;

export const REVIEW_SCORECARD_EMPTY_SECONDARY_ACTION = CREATE_ARCHITECTURE_LABEL;

export const REVIEW_SCORECARD_OPEN_PACKAGES_ACTION = "Open review packages" as const;

export const REVIEW_SCORECARD_VIEW_SAMPLE_ACTION = "View sample scorecard" as const;

export const REVIEW_SCORECARD_SAMPLE_HREF = "/executive/scorecard" as const;

export const REVIEW_SCORECARD_DATA_REQUIREMENT_NOTE =
  "Scorecard metrics appear after at least one review package is finalized." as const;

export const REVIEW_SCORECARD_PREVIEW_SECTION_TITLE = "What this scorecard will show" as const;

export type ReviewScorecardPreviewMetric = {
  readonly label: string;
  readonly placeholderDetail: string;
};

export const REVIEW_SCORECARD_PREVIEW_METRICS: readonly ReviewScorecardPreviewMetric[] = [
  {
    label: "Finalized review packages",
    placeholderDetail: "Count of review packages finalized in this workspace.",
  },
  {
    label: "Affirmed findings",
    placeholderDetail: "Findings with positive reviewer feedback.",
  },
  {
    label: "Governance approvals",
    placeholderDetail: "Completed governance approvals in scope.",
  },
  {
    label: "Average review cycle time",
    placeholderDetail: "Typical time from intake to finalized package.",
  },
  {
    label: "Estimated review-time savings",
    placeholderDetail: "Modeled savings from saved ROI assumptions.",
  },
] as const;
