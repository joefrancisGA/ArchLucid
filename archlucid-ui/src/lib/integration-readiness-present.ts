import type { ConnectorDisplayStatus } from "@/lib/connector-operations-present";
import {
  isDisabledConnector,
  resolveConnectorHumanStatus,
  resolveIntegrationEventBusHumanStatus,
} from "@/lib/connector-operations-present";
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

export function formatIntegrationReadinessLastChecked(configurationReadAt: Date): string {
  return `Configuration read at ${configurationReadAt.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })}`;
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
