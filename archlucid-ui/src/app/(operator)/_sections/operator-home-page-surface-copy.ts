import { WORKING_HOME_NEW_REVIEW_BRIDGE_COPY } from "@/lib/system-not-job-no-second-start-cta-working";

export const OPERATOR_HOME_PRIMARY_CONTENT_ID = "operator-home-primary-content" as const;

export const OPERATOR_HOME_FIRST_VIEWPORT_TEST_ID = "operator-home-first-viewport" as const;

export const OPERATOR_HOME_SKIP_TARGET_ID = OPERATOR_HOME_FIRST_VIEWPORT_TEST_ID;

export const OPERATOR_HOME_SKIP_LINK_LABEL = "Skip to home workspace" as const;

export const OPERATOR_HOME_HEADER_CLAIM_DISCIPLINE_TEST_ID = "operator-home-header-claim-discipline" as const;

export const OPERATOR_HOME_ORIENTATION_BOTTOM_TEST_ID = "operator-home-orientation-bottom" as const;

export const OPERATOR_HOME_PAGE_LEAD =
  "Resume active reviews, start new architecture work, and track recent results from your workspace home." as const;

export const OPERATOR_HOME_BUYER_OVERVIEW =
  "Use the workspace sections below to continue in-progress reviews or open completed results; follow-up links appear after your first committed review package." as const;

/** Single orientation block under Home primary CTA (seal bridge + workspace lead + section overview). */
export const OPERATOR_HOME_BUYER_ORIENTATION_PARAGRAPH =
  `${WORKING_HOME_NEW_REVIEW_BRIDGE_COPY} ${OPERATOR_HOME_PAGE_LEAD} ${OPERATOR_HOME_BUYER_OVERVIEW}` as const;
