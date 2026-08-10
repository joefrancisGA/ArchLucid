import { REVIEW_GUIDE_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-review-guide-help";

/**
 * Removed traffic workbook row ID for the retired `/help/creating-runs` alias (merged into HR).
 * Do not reintroduce — review guide help is scored only on HR (`/help/review-guide`).
 */
export const REMOVED_CREATING_RUNS_HELP_ALIAS_TRAFFIC_ROW_ID = "HER";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_CREATING_RUNS_HELP_ALIAS_TRAFFIC_PATH = "/help/creating-runs";

/** Canonical review guide help scored on traffic row HR. */
export const CANONICAL_REVIEW_GUIDE_HELP_TRAFFIC_PATH = REVIEW_GUIDE_HELP_TRAFFIC_PATH;
