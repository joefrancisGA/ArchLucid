import {
 FIRST_REVIEW_GUIDE_PATH,
 LEGACY_ONBOARDING_PATH,
} from "@/lib/first-review-guide-route";

/**
 * Traffic workbook row ID for the First review guide product hub.
 * Owner backlog shorthand: ARF.
 */
export const FIRST_REVIEW_GUIDE_TRAFFIC_ROW_ID = "OSX";

/** Canonical path tracked on the ARF workbook row. */
export const FIRST_REVIEW_GUIDE_TRAFFIC_PATH = FIRST_REVIEW_GUIDE_PATH;

/** Workbook Section column value — onboarding / first-run product hub. */
export const FIRST_REVIEW_GUIDE_TRAFFIC_SECTION = "Onboarding";

/**
 * Owner workbook Notes for ARF - documents Evidence chrome on First review guide.
 * ASCII-only for Windows console note scripts.
 */
export const FIRST_REVIEW_GUIDE_TRAFFIC_NOTE = "None";

/** Retired onboarding bookmark path (no App Router redirect). */
export const LEGACY_ONBOARDING_TRAFFIC_PATH = LEGACY_ONBOARDING_PATH;
