import type { ConnectorDisplayStatus } from "@/lib/connector-operations-present";

export type ConnectionStatusHelpStatusLegendRow = {
  readonly status: ConnectorDisplayStatus;
  readonly meaning: string;
  readonly nextAction: string;
};

/** Every live connector status tag — help legend must stay exhaustive. */
export const CONNECTION_STATUS_HELP_STATUS_LEGEND: readonly ConnectionStatusHelpStatusLegendRow[] = [
  {
    status: "Ready",
    meaning: "Connector is configured and validated for this workspace.",
    nextAction: "No setup work remains unless you are changing scope.",
  },
  {
    status: "Recommended",
    meaning: "ArchLucid recommends this connector for most pilots in this category.",
    nextAction: "Open the connector page to finish credentials or validation.",
  },
  {
    status: "Optional",
    meaning: "Useful for advanced workflows but not required for a first review.",
    nextAction: "Configure when your operating model needs this channel.",
  },
  {
    status: "Not configured",
    meaning: "No live configuration exists for this connector yet.",
    nextAction: "Open the connector surface to start setup.",
  },
  {
    status: "Disabled",
    meaning: "Connector is intentionally turned off for this workspace.",
    nextAction: "Re-enable from the connector page when the integration is in scope.",
  },
  {
    status: "Needs attention",
    meaning: "Configuration exists but validation or runtime checks need follow-up.",
    nextAction: "Open the connector page or system health to resolve the issue.",
  },
] as const;

export const ALL_CONNECTOR_DISPLAY_STATUSES: readonly ConnectorDisplayStatus[] =
  CONNECTION_STATUS_HELP_STATUS_LEGEND.map((row) => row.status);
