import type { ConnectorDisplayStatus } from "@/lib/connector-operations-present";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  isDisabledConnector,
  resolveConnectorHumanStatus,
  resolveIntegrationEventBusHumanStatus,
} from "@/lib/connector-operations-present";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import type { ConnectorSurfaceStatusDto, IntegrationEventBusStatusDto } from "@/types/operate-rhythm";

export type IntegrationBackgroundDeliveryLabel = "Configured" | "Not configured" | "Not required";

const CONNECTOR_CONFIGURE_HELPER: Readonly<Record<string, string>> = {
  teams: "Send review notifications to a channel.",
  slack: "Send review alerts to a channel.",
  jira: "Create backlog tickets from findings.",
  azureBoards: "Create Azure Boards work items from findings.",
  servicenow: "Create incident or compliance workflow records.",
  digests_advisory: "Send recurring architecture summaries.",
  outbound_webhooks: "Deliver signed HTTPS events to your endpoint.",
  confluence: "Publish review artifacts to Confluence.",
};

export function resolveConnectorConfigureHelper(connectorKey: string): string | null {
  return CONNECTOR_CONFIGURE_HELPER[connectorKey] ?? null;
}

export function resolveConnectorDetailsLabel(
  displayStatus: ConnectorDisplayStatus,
  isDisabled: boolean,
): string | null {
  if (isDisabled) {
    return "View requirements";
  }

  if (displayStatus === "Ready") {
    return "What this enables";
  }

  return "View setup details";
}

export function resolveIntegrationBackgroundDeliveryLabel(
  bus: IntegrationEventBusStatusDto,
): IntegrationBackgroundDeliveryLabel {
  const humanStatus = resolveIntegrationEventBusHumanStatus(bus);

  if (humanStatus === "Ready") {
    return "Configured";
  }

  if (humanStatus === "Configuration incomplete" || humanStatus === "Needs attention") {
    return "Not configured";
  }

  return "Not required";
}

export function isConnectorDisabledForDeployment(connector: ConnectorSurfaceStatusDto): boolean {
  return isDisabledConnector(connector) || resolveConnectorHumanStatus(connector) === "Disabled";
}

/** After this age, connection status should prompt a manual refresh. */
export const INTEGRATION_READINESS_STALE_AFTER_MS = 5 * 60 * 1000;

export type IntegrationReadinessFreshness = {
  readonly absoluteLine: string;
  readonly relativeLine: string;
  readonly stale: boolean;
};

export function isIntegrationReadinessSnapshotStale(
  configurationReadAt: Date,
  nowMs: number = Date.now(),
): boolean {
  return nowMs - configurationReadAt.getTime() > INTEGRATION_READINESS_STALE_AFTER_MS;
}

export function resolveIntegrationReadinessSnapshotIso(
  configurationReadAt: Date,
  serverAsOfUtc: string | null | undefined,
): string {
  const explicit = serverAsOfUtc?.trim() ?? "";

  if (explicit.length > 0) {
    return explicit;
  }

  return configurationReadAt.toISOString();
}

export function formatIntegrationReadinessFreshness(
  configurationReadAt: Date,
  serverAsOfUtc: string | null | undefined,
  nowMs: number = Date.now(),
): IntegrationReadinessFreshness {
  const snapshotIso = resolveIntegrationReadinessSnapshotIso(configurationReadAt, serverAsOfUtc);
  const stale = isIntegrationReadinessSnapshotStale(configurationReadAt, nowMs);

  return {
    absoluteLine: `Configuration read at ${formatInstantForLocale(snapshotIso)}`,
    relativeLine: formatRelativeTime(snapshotIso, nowMs),
    stale,
  };
}

export function formatIntegrationReadinessLastChecked(configurationReadAt: Date): string {
  return formatIntegrationReadinessFreshness(configurationReadAt, null).absoluteLine;
}

export function formatIntegrationReadinessWorkspaceScopeLine(workspaceScopeLabel: string): string {
  return `Workspace scope: ${workspaceScopeLabel}`;
}

export function resolveConnectorRowActionLabel(
  displayStatus: ConnectorDisplayStatus,
  disabledForDeployment: boolean,
  configurationHref: string | null,
): string | null {
  if (disabledForDeployment) {
    return "View requirements";
  }

  if (configurationHref === null) {
    return null;
  }

  if (displayStatus === "Ready") {
    return "Manage setup";
  }

  return "Open setup";
}
