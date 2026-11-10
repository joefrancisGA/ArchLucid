import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { CUSTOMER_INTAKE_PRIMARY_FINDING_ID, CUSTOMER_INTAKE_SAMPLE_RUN_ID } from "@/lib/samples/customer-intake-modernization/definition";

export const FIRST_REVIEW_OPEN_GATE_STARTER_HEADING = "First-review open gate (sample)" as const;

export const FIRST_REVIEW_OPEN_GATE_STARTER_LEAD =
  "Open the curated sample review on the first-review spine. Not a customer result." as const;

export const FIRST_REVIEW_OPEN_GATE_STARTER_NOT_THIS_REVIEW =
  "Policy-pack assignment is not this review." as const;

export const FIRST_REVIEW_OPEN_GATE_STARTER_PATH = "/architecture/first-review-guide" as const;

/** Sample review with findings tab and primary finding — spine band is in the overview viewport. */
export const FIRST_REVIEW_OPEN_GATE_STARTER_HREF = buildReviewDetailTabHref(
  CUSTOMER_INTAKE_SAMPLE_RUN_ID,
  "overview",
  {
    findingId: CUSTOMER_INTAKE_PRIMARY_FINDING_ID,
    workbenchFocus: "findings",
    hash: "run-detail-first-review-spine-findings",
  },
);
