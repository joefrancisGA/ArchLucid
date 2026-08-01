import { ADMINISTRATION_CONNECTION_STATUS_PATH } from "@/lib/integrations-nav-paths";

/**
 * Traffic workbook row ID for Administration Connection status.
 * Owner backlog shorthand: ADC.
 */
export const CONNECTION_STATUS_TRAFFIC_ROW_ID = "INR";

/** Canonical path tracked on the INR workbook row. */
export const CONNECTION_STATUS_TRAFFIC_PATH = ADMINISTRATION_CONNECTION_STATUS_PATH;

/** Workbook Section column value — tenant Administration job, not pre-login marketing. */
export const CONNECTION_STATUS_TRAFFIC_SECTION = "Admin";

/**
 * Owner workbook Notes for INR/ADC — documents the live connector readiness hub.
 */
export const CONNECTION_STATUS_TRAFFIC_NOTE =
  "Administration Connection status hub — ConnectorOperationsDashboard groups connector readiness with summary tiles and recommended-first setup. PageContextualHelpButton + integration-readiness help. Canonical path /administration/connection-status.";
