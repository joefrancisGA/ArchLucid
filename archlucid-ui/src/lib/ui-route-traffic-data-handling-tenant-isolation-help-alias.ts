import { DATA_HANDLING_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-data-handling-help";

/**
 * Removed traffic workbook row ID for the retired `/help/data-handling-tenant-isolation` alias (merged into HED).
 * Do not reintroduce — data-handling help is scored only on HED (`/help/data-handling`).
 */
export const REMOVED_DATA_HANDLING_TENANT_ISOLATION_HELP_ALIAS_TRAFFIC_ROW_ID = "HDA";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_DATA_HANDLING_TENANT_ISOLATION_HELP_ALIAS_TRAFFIC_PATH =
  "/help/data-handling-tenant-isolation";

/** Canonical data-handling help scored on traffic row HED. */
export const CANONICAL_DATA_HANDLING_HELP_TRAFFIC_PATH = DATA_HANDLING_HELP_TRAFFIC_PATH;
