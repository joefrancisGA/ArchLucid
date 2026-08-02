import {
  FIRST_REVIEW_GUIDE_PATH,
  LEGACY_ONBOARDING_PATH,
} from "@/lib/first-review-guide-route";

/**
 * Traffic workbook row ID for the First review guide product hub.
 * Owner backlog shorthand: ARF.
 */
export const FIRST_REVIEW_GUIDE_TRAFFIC_ROW_ID = "ARF";

/** Canonical path tracked on the ARF workbook row. */
export const FIRST_REVIEW_GUIDE_TRAFFIC_PATH = FIRST_REVIEW_GUIDE_PATH;

/** Workbook Section column value — onboarding / first-run product hub. */
export const FIRST_REVIEW_GUIDE_TRAFFIC_SECTION = "Onboarding";

/**
 * Owner workbook Notes for ARF — documents the live first-review onboarding hub.
 */
export const FIRST_REVIEW_GUIDE_TRAFFIC_NOTE =
  "Canonical first-review onboarding hub — FirstReviewGuidePageClient with walkthrough steps, required setup panel, optional workspace setup, and registration trial card (`?source=registration`). Left nav First review guide. Legacy /onboarding retired (no redirect). Signup verify handoff via SIGNUP_VERIFY_ONBOARDING_PATH. Former workbook row ONB.";

/** Retired onboarding bookmark path (no App Router redirect). */
export const LEGACY_ONBOARDING_TRAFFIC_PATH = LEGACY_ONBOARDING_PATH;
