import { FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-first-architecture-review-help";

/**
 * Removed traffic workbook row ID for the retired `/help/first-pilot-path` alias (merged into COR).
 * Do not reintroduce — first-architecture-review help is scored only on COR.
 */
export const REMOVED_FIRST_PILOT_PATH_HELP_ALIAS_TRAFFIC_ROW_ID = "FIR";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_FIRST_PILOT_PATH_HELP_ALIAS_TRAFFIC_PATH = "/help/first-pilot-path";

/** Canonical first-architecture-review help scored on traffic row COR. */
export const CANONICAL_FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH_FROM_FIRST_PILOT_PATH =
  FIRST_ARCHITECTURE_REVIEW_HELP_TRAFFIC_PATH;
