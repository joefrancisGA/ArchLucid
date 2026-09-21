import { WORKING_HOME_NEW_REVIEW_BRIDGE_COPY } from "@/lib/system-not-job-no-second-start-cta-working";

export const OPERATOR_HOME_PRIMARY_CONTENT_ID = "operator-home-primary-content" as const;

export const OPERATOR_HOME_FIRST_VIEWPORT_TEST_ID = "operator-home-first-viewport" as const;

export const OPERATOR_HOME_SKIP_TARGET_ID = OPERATOR_HOME_FIRST_VIEWPORT_TEST_ID;

export const OPERATOR_HOME_SKIP_LINK_LABEL = "Skip to home workspace" as const;

export const OPERATOR_HOME_HEADER_CLAIM_DISCIPLINE_TEST_ID = "operator-home-header-claim-discipline" as const;

export const OPERATOR_HOME_ORIENTATION_BOTTOM_TEST_ID = "operator-home-orientation-bottom" as const;

/** Empty Home lead — start language only; resume copy is reserved for work already on the desk. */
export const OPERATOR_HOME_PAGE_LEAD =
  "Start new architecture work and track recent results from your workspace home." as const;

export const OPERATOR_HOME_BUYER_OVERVIEW =
  "In-progress and completed reviews will appear in the sections below; follow-up links appear after your first committed architecture package." as const;

export const OPERATOR_HOME_RETURNING_PAGE_LEAD =
  "Resume active reviews, start new architecture work, and track recent results from your workspace home." as const;

export const OPERATOR_HOME_RETURNING_OVERVIEW =
  "Use the workspace sections below to continue in-progress reviews or open completed results." as const;

export const OPERATOR_HOME_COMPLETED_PAGE_LEAD =
  "Open completed reviews, start new architecture work, and track recent results from your workspace home." as const;

export const OPERATOR_HOME_COMPLETED_OVERVIEW =
  "Use the workspace sections below to open completed results or start another review." as const;

/** Single orientation block under Home primary CTA when nothing is in progress. */
export const OPERATOR_HOME_BUYER_ORIENTATION_PARAGRAPH =
  `${WORKING_HOME_NEW_REVIEW_BRIDGE_COPY} ${OPERATOR_HOME_PAGE_LEAD} ${OPERATOR_HOME_BUYER_OVERVIEW}` as const;

export const OPERATOR_HOME_RETURNING_ORIENTATION_PARAGRAPH =
  `${OPERATOR_HOME_RETURNING_PAGE_LEAD} ${OPERATOR_HOME_RETURNING_OVERVIEW}` as const;

export const OPERATOR_HOME_COMPLETED_ORIENTATION_PARAGRAPH =
  `${OPERATOR_HOME_COMPLETED_PAGE_LEAD} ${OPERATOR_HOME_COMPLETED_OVERVIEW}` as const;

export type OperatorHomeOrientationSignals = {
  readonly hasReviews?: boolean;
  readonly reviewPackagesActive?: number;
};

/** Pick Home orientation copy from workspace activity so empty desks never say resume. */
export function operatorHomeOrientationParagraph(
  signals?: OperatorHomeOrientationSignals,
): string {
  if (signals === undefined || signals.hasReviews !== true) {
    return OPERATOR_HOME_BUYER_ORIENTATION_PARAGRAPH;
  }

  if ((signals.reviewPackagesActive ?? 0) > 0) {
    return OPERATOR_HOME_RETURNING_ORIENTATION_PARAGRAPH;
  }

  return OPERATOR_HOME_COMPLETED_ORIENTATION_PARAGRAPH;
}
