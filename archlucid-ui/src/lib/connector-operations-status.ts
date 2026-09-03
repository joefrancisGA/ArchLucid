import type {
  ConnectorSurfaceStatusDto,
  IntegrationEventBusStatusDto,
} from "@/types/operate-rhythm";

export type ConnectorHumanStatus =
  | "Not configured"
  | "Configuration incomplete"
  | "Ready"
  | "Disabled"
  | "Needs attention";

export type ConnectorDisplayStatus =
  | "Ready"
  | "Recommended"
  | "Optional"
  | "Disabled"
  | "Not configured"
  | "Needs attention";

const RECOMMENDED_CONNECTOR_KEYS = new Set<string>(["teams", "slack"]);
const OPTIONAL_CONNECTOR_KEYS = new Set<string>([
  "jira",
  "azureBoards",
  "servicenow",
  "confluence",
  "digests_advisory",
  "outbound_webhooks",
]);

export const CONFLUENCE_PUBLISHING_DISABLED_CUSTOMER_SUMMARY =
  "Confluence publishing is disabled for this deployment.";

export function isRecommendedConnector(connectorKey: string): boolean {
  return RECOMMENDED_CONNECTOR_KEYS.has(connectorKey);
}

export function isOptionalConnector(connectorKey: string): boolean {
  return OPTIONAL_CONNECTOR_KEYS.has(connectorKey);
}

export function isDisabledConnector(connector: ConnectorSurfaceStatusDto): boolean {
  if (connector.connectorKey !== "confluence") {
    return false;
  }

  return connector.summary.toLowerCase().includes("disabled");
}

export function resolveConnectorHumanStatus(connector: ConnectorSurfaceStatusDto): ConnectorHumanStatus {
  if (isDisabledConnector(connector)) {
    return "Disabled";
  }

  const readiness = connector.smokeReadiness.trim();

  if (readiness === "LocallyValid" || readiness === "RouteConfigured") {
    return "Ready";
  }

  if (readiness === "ConfigurationIncomplete") {
    return "Configuration incomplete";
  }

  if (readiness === "NotConfigured") {
    return "Not configured";
  }

  return "Needs attention";
}

export function isConnectorReady(connector: ConnectorSurfaceStatusDto | null | undefined): boolean {
  if (connector === null || connector === undefined) {
    return false;
  }

  return resolveConnectorHumanStatus(connector) === "Ready";
}

export function resolveConnectorDisplayStatus(connector: ConnectorSurfaceStatusDto): ConnectorDisplayStatus {
  const humanStatus = resolveConnectorHumanStatus(connector);

  if (humanStatus === "Ready") {
    return "Ready";
  }

  if (humanStatus === "Disabled") {
    return "Disabled";
  }

  if (humanStatus === "Needs attention") {
    return "Needs attention";
  }

  if (isRecommendedConnector(connector.connectorKey)) {
    return "Recommended";
  }

  if (isOptionalConnector(connector.connectorKey)) {
    if (humanStatus === "Configuration incomplete") {
      return "Optional";
    }

    return "Not configured";
  }

  if (humanStatus === "Configuration incomplete") {
    return "Needs attention";
  }

  return "Not configured";
}

export function formatConnectorDisplayStatus(connector: ConnectorSurfaceStatusDto): string {
  return resolveConnectorDisplayStatus(connector);
}

/** @deprecated Use {@link formatConnectorDisplayStatus} — kept for transitional imports. */
export function formatConnectorStatusLabel(
  connector: ConnectorSurfaceStatusDto,
  humanStatus: ConnectorHumanStatus,
): string {
  void humanStatus;

  return formatConnectorDisplayStatus(connector);
}

export function resolveIntegrationEventBusHumanStatus(
  bus: IntegrationEventBusStatusDto,
): ConnectorHumanStatus {
  const readiness = bus.smokeReadiness.trim();

  if (readiness === "LocallyValid") {
    return "Ready";
  }

  if (readiness === "ConfigurationIncomplete") {
    return "Configuration incomplete";
  }

  if (readiness === "NotConfigured") {
    return "Not configured";
  }

  return "Needs attention";
}

export function resolveIntegrationEventBusDisplayStatus(
  bus: IntegrationEventBusStatusDto,
): ConnectorDisplayStatus {
  const humanStatus = resolveIntegrationEventBusHumanStatus(bus);

  if (humanStatus === "Ready") {
    return "Ready";
  }

  if (humanStatus === "Configuration incomplete") {
    return "Needs attention";
  }

  if (humanStatus === "Not configured") {
    return "Not configured";
  }

  return "Needs attention";
}
