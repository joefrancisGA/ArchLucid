import { REVIEW_GUIDE_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-review-guide-help";

/**
 * Removed traffic workbook row ID for the retired `/help/starting-reviews` alias (merged into HR).
 * Do not reintroduce — review guide help is scored only on HR (`/help/review-guide`).
 */
export const REMOVED_STARTING_REVIEWS_HELP_ALIAS_TRAFFIC_ROW_ID = "HET";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_STARTING_REVIEWS_HELP_ALIAS_TRAFFIC_PATH = "/help/starting-reviews";

/** Canonical review guide help scored on traffic row HR. */
export const CANONICAL_REVIEW_GUIDE_HELP_TRAFFIC_PATH_FROM_STARTING_REVIEWS = REVIEW_GUIDE_HELP_TRAFFIC_PATH;
