import { AZURE_BOARDS_HELP_TRAFFIC_PATH } from "@/lib/ui-route-traffic-azure-boards-help";

/**
 * Removed traffic workbook row ID for the retired `/help/integrations/azure-boards` alias (merged into HEZ).
 * Do not reintroduce — Azure Boards help is scored only on HEZ (`/help/azure-boards`).
 */
export const REMOVED_AZURE_BOARDS_HELP_ALIAS_TRAFFIC_ROW_ID = "HAZ";

/** Retired alias bookmark — not a standalone traffic row. */
export const RETIRED_AZURE_BOARDS_HELP_ALIAS_TRAFFIC_PATH = "/help/integrations/azure-boards";

/** Canonical Azure Boards help scored on traffic row HEZ. */
export const CANONICAL_AZURE_BOARDS_HELP_TRAFFIC_PATH = AZURE_BOARDS_HELP_TRAFFIC_PATH;
