import {
  REVIEWS_NEW_DETAILED_HREF,
  REVIEWS_NEW_DETAILED_PATH_TOKEN,
  REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL,
} from "@/lib/reviews-new-path-copy";

/**
 * Traffic workbook row ID for Start review Templates and imports path tab.
 * Owner backlog shorthand: REN.
 */
export const REVIEWS_NEW_DETAILED_TAB_TRAFFIC_ROW_ID = "REN";

/** Canonical path tracked on the REN workbook row. */
export const REVIEWS_NEW_DETAILED_TAB_TRAFFIC_PATH = REVIEWS_NEW_DETAILED_HREF;

/** Workbook Section column value - query-path tab on Start review hub. */
export const REVIEWS_NEW_DETAILED_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for REN - documents Evidence chrome inherited from RNX hub on detailed path.
 * ASCII-only for Windows console note scripts.
 */
/** Product tab label used in traffic notes (TB-1866). */
export const REVIEWS_NEW_DETAILED_TAB_PRODUCT_LABEL = REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL;

/** Path query token on the REN workbook row (aliases to {@link REVIEWS_NEW_DETAILED_TAB_PRODUCT_LABEL}). */
export const REVIEWS_NEW_DETAILED_TAB_PATH_TOKEN = REVIEWS_NEW_DETAILED_PATH_TOKEN;

export const REVIEWS_NEW_DETAILED_TAB_TRAFFIC_NOTE =
  `Start review ${REVIEWS_NEW_TEMPLATES_AND_IMPORTS_TAB_LABEL} tab (path=${REVIEWS_NEW_DETAILED_PATH_TOKEN}) (Tab surface) - inherits RNX hub Evidence chrome (ReviewsNewPageChrome PageContextualHelpButton + Category-1 registry on /architecture/reviews/new; Sources strip above path tabs). ReviewsNewPathSwitcher syncs ?path=${REVIEWS_NEW_DETAILED_PATH_TOKEN}; mounts NewRunWizardClient. Sibling REQ = quick-review; ENE = guided-intake; RNX = hub. Score 58/100 (2026-08-08) - path-tab surface below RNX launcher; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.`;
