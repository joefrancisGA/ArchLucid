import {
  REVIEWS_NEW_GUIDED_INTAKE_HREF,
  REVIEWS_NEW_GUIDED_INTAKE_PATH_TOKEN,
  REVIEWS_NEW_GUIDED_QUESTIONS_LABEL,
} from "@/lib/reviews-new-path-copy";

/**
 * Traffic workbook row ID for Start review Guided questions path tab.
 * Owner backlog shorthand: ENE.
 */
export const REVIEWS_NEW_GUIDED_INTAKE_TAB_TRAFFIC_ROW_ID = "ENE";

/** Canonical path tracked on the ENE workbook row. */
export const REVIEWS_NEW_GUIDED_INTAKE_TAB_TRAFFIC_PATH = REVIEWS_NEW_GUIDED_INTAKE_HREF;

/** Workbook Section column value - query-path tab on Start review hub. */
export const REVIEWS_NEW_GUIDED_INTAKE_TAB_TRAFFIC_SECTION = "Tab surface";

/**
 * Owner workbook Notes for ENE - documents Evidence chrome inherited from RNX hub on Guided questions.
 * ASCII-only for Windows console note scripts.
 */
/** Product tab label used in traffic notes (TB-1876). */
export const REVIEWS_NEW_GUIDED_INTAKE_TAB_PRODUCT_LABEL = REVIEWS_NEW_GUIDED_QUESTIONS_LABEL;

/** Path query token on the ENE workbook row (aliases to {@link REVIEWS_NEW_GUIDED_INTAKE_TAB_PRODUCT_LABEL}). */
export const REVIEWS_NEW_GUIDED_INTAKE_TAB_PATH_TOKEN = REVIEWS_NEW_GUIDED_INTAKE_PATH_TOKEN;

export const REVIEWS_NEW_GUIDED_INTAKE_TAB_TRAFFIC_NOTE =
  `Start review ${REVIEWS_NEW_GUIDED_QUESTIONS_LABEL} tab (path=${REVIEWS_NEW_GUIDED_INTAKE_PATH_TOKEN}) (Tab surface) - inherits RNX hub Evidence chrome (ReviewsNewPageChrome PageContextualHelpButton + Category-1 registry on /architecture/reviews/new; Sources strip above path tabs). ReviewsNewPathSwitcher syncs ?path=${REVIEWS_NEW_GUIDED_INTAKE_PATH_TOKEN}; mounts SocraticIntakeWizard. Sibling REQ = quick-review; REN = detailed; RNX = hub. Score 58/100 (2026-08-08) - path-tab surface below RNX launcher; hard-caps higher Evidence without sealed-record diligence Sources trail. Owner pass: Evidence chrome shipped; cannot improve further toward 80 without turning this into a sealed-record diligence Sources trail.`;
