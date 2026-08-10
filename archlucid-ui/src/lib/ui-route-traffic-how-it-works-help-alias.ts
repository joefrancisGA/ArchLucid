import { GETTING_STARTED_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-getting-started-help";

/**
 * Removed traffic workbook row ID for the retired `/help/how-it-works` alias (merged into HGX).
 * Do not reintroduce — getting started help is scored only on HGX (`/help/getting-started`).
 */
export const REMOVED_HOW_IT_WORKS_HELP_ALIAS_TRAFFIC_ROW_ID = "HHX";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_HOW_IT_WORKS_HELP_ALIAS_TRAFFIC_PATH = "/help/how-it-works";

/** Canonical getting started help scored on traffic row HGX. */
export const CANONICAL_GETTING_STARTED_HELP_TRAFFIC_PATH_FROM_HOW_IT_WORKS = GETTING_STARTED_HELP_TRAFFIC_PATH;
