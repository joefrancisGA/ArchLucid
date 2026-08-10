import { EXECUTIVE_SUMMARY_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-executive-summary-help";

/**
 * Removed traffic workbook row ID for the retired `/help/product-overview` alias (merged into EXE).
 * Do not reintroduce — executive summary help is scored only on EXE (`/help/executive-summary`).
 */
export const REMOVED_PRODUCT_OVERVIEW_HELP_ALIAS_TRAFFIC_ROW_ID = "EPR";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_PRODUCT_OVERVIEW_HELP_ALIAS_TRAFFIC_PATH = "/help/product-overview";

/** Canonical executive summary help scored on traffic row EXE. */
export const CANONICAL_EXECUTIVE_SUMMARY_HELP_TRAFFIC_PATH_FROM_PRODUCT_OVERVIEW =
  EXECUTIVE_SUMMARY_HELP_TRAFFIC_PATH;
