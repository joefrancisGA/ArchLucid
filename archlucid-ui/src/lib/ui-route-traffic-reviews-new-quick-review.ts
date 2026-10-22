import {
  REVIEWS_NEW_QUICK_REVIEW_HREF,
  REVIEWS_NEW_QUICK_REVIEW_PATH_TOKEN,
  REVIEWS_NEW_QUICK_START_TAB_LABEL,
} from "@/lib/reviews-new-path-copy";

/**
 * Traffic workbook row ID for Start review Quick start path tab.
 * Owner backlog shorthand: REQ.
 */
export const REVIEWS_NEW_QUICK_REVIEW_TAB_TRAFFIC_ROW_ID = "REQ";

/** Canonical path tracked on the REQ workbook row. */
export const REVIEWS_NEW_QUICK_REVIEW_TAB_TRAFFIC_PATH = REVIEWS_NEW_QUICK_REVIEW_HREF;

/** Workbook Section column value - query-path tab on Start review hub. */
export const REVIEWS_NEW_QUICK_REVIEW_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for REQ - documents Evidence chrome inherited from RNX hub on quick-review path.
 * ASCII-only for Windows console note scripts.
 */
/** Product tab label used in traffic notes (TB-1871). */
export const REVIEWS_NEW_QUICK_REVIEW_TAB_PRODUCT_LABEL = REVIEWS_NEW_QUICK_START_TAB_LABEL;

/** Path query token on the REQ workbook row (aliases to {@link REVIEWS_NEW_QUICK_REVIEW_TAB_PRODUCT_LABEL}). */
export const REVIEWS_NEW_QUICK_REVIEW_TAB_PATH_TOKEN = REVIEWS_NEW_QUICK_REVIEW_PATH_TOKEN;

export const REVIEWS_NEW_QUICK_REVIEW_TAB_TRAFFIC_NOTE =
  `Start review ${REVIEWS_NEW_QUICK_START_TAB_LABEL} tab (path=${REVIEWS_NEW_QUICK_REVIEW_PATH_TOKEN}) (Tab surface) - inherits RNX hub Evidence chrome (ReviewsNewPageChrome PageContextualHelpButton + Category-1 registry on /architecture/reviews/new; Sources strip above path tabs). ReviewsNewPathSwitcher syncs ?path=${REVIEWS_NEW_QUICK_REVIEW_PATH_TOKEN}; mounts FirstPilotIntakeWizard. Sibling REN = detailed; ENE = guided-intake; RNX = hub. Score 58/100 (2026-08-08) - path-tab surface below RNX launcher; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.`;
