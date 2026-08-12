import type { EnterpriseStatusKind } from "@/lib/design-tokens";
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

export type ConnectorPurposeGroupId = "notifications" | "ticketing" | "publishing" | "technical";

export type ConnectorPurposeGroup = {
  id: ConnectorPurposeGroupId;
  title: string;
  description: string;
};

export const CONNECTOR_PURPOSE_GROUPS: readonly ConnectorPurposeGroup[] = [
  {
    id: "notifications",
    title: "Notify the team",
    description: "Deliver review outcomes and alerts to collaboration channels.",
  },
  {
    id: "ticketing",
    title: "Create tickets",
    description: "Open engineering or operations tickets from findings when your workflow needs them.",
  },
  {
    id: "publishing",
    title: "Publish and digest updates",
    description: "Share review artifacts to knowledge bases and send scheduled architecture digests to stakeholders.",
  },
  {
    id: "technical",
    title: "Advanced delivery infrastructure",
    description: "Background event delivery for asynchronous integration workflows — not required for standard reviews.",
  },
] as const;

const RECOMMENDED_CONNECTOR_KEYS = new Set<string>(["teams", "slack"]);
const OPTIONAL_CONNECTOR_KEYS = new Set<string>([
  "jira",
  "azureBoards",
  "servicenow",
  "confluence",
  "digests_advisory",
  "outbound_webhooks",
]);

const CONNECTOR_GROUP_BY_KEY: Record<string, ConnectorPurposeGroupId> = {
  teams: "notifications",
  slack: "notifications",
  outbound_webhooks: "notifications",
  jira: "ticketing",
  azureBoards: "ticketing",
  servicenow: "ticketing",
  confluence: "publishing",
  digests_advisory: "publishing",
};

const CONNECTOR_CARD_TITLES: Record<string, string> = {
  teams: "Microsoft Teams",
  slack: "Slack",
  outbound_webhooks: "Outbound HTTP webhooks",
  jira: "Jira",
  azureBoards: "Azure Boards",
  servicenow: "ServiceNow",
  confluence: "Confluence publishing",
  digests_advisory: "Architecture digests",
};

const CONNECTOR_BEST_FOR: Record<string, string> = {
  teams: "Best for review and alert notifications.",
  slack: "Best for review and alert notifications.",
  outbound_webhooks: "Best for custom automation.",
  jira: "Best for creating engineering backlog tickets.",
  azureBoards: "Best for creating Azure Boards work items from findings.",
  servicenow: "Best for incident or compliance workflows.",
  confluence: "Best for publishing review artifacts to Confluence.",
  digests_advisory: "Best for recurring architecture digests to stakeholders.",
};

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

const INTEGRATIONS_CONFIG_KEY_PATTERN = /Integrations:/i;

export const CONFLUENCE_PUBLISHING_DISABLED_CUSTOMER_SUMMARY =
  "Confluence publishing is disabled for this deployment.";

/** Maps deployment-operator connector summaries to buyer-safe text for integration readiness cards (TB-777). */
export function formatConnectorCustomerSummary(connector: ConnectorSurfaceStatusDto): string {
  if (isDisabledConnector(connector)) {
    return CONFLUENCE_PUBLISHING_DISABLED_CUSTOMER_SUMMARY;
  }

  const summary = connector.summary.trim();

  if (summary.length === 0) {
    return "";
  }

  if (INTEGRATIONS_CONFIG_KEY_PATTERN.test(summary)) {
    return resolveConnectorGuidance(connector, resolveConnectorHumanStatus(connector));
  }

  return summary;
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

export function resolveConnectorBestFor(connectorKey: string): string | null {
  return CONNECTOR_BEST_FOR[connectorKey] ?? null;
}

export function resolveConnectorGuidance(connector: ConnectorSurfaceStatusDto, humanStatus: ConnectorHumanStatus): string {
  switch (connector.connectorKey) {
    case "teams":
      if (humanStatus === "Ready") {
        return "Teams notifications are configured for this tenant.";
      }

      return "Set up a Teams incoming webhook to deliver review notifications to a channel.";

    case "slack":
      if (humanStatus === "Ready") {
        return "Slack alert routing is configured in this workspace scope.";
      }

      return "Add an enabled Slack webhook route to deliver alert notifications.";

    case "outbound_webhooks":
      if (humanStatus === "Ready") {
        return "Outbound HTTPS webhook subscriptions are configured for this workspace scope.";
      }

      return "Register a webhook subscription to deliver ArchLucid events to a custom HTTPS endpoint.";

    case "jira":
      if (humanStatus === "Ready") {
        return "Jira Cloud settings are populated. Live ticket creation still requires a successful connection test.";
      }

      return "Add a Jira Cloud base URL to enable outbound ticket creation from findings.";

    case "azureBoards":
      if (humanStatus === "Ready") {
        return "Azure Boards settings are populated. Live work item creation still requires a successful connection test.";
      }

      return "Connect an Azure DevOps organization and choose a default project to create work items from findings.";

    case "servicenow":
      if (humanStatus === "Ready") {
        return "ServiceNow settings are populated. Live ticket creation still requires a successful connection test.";
      }

      return "Add a ServiceNow instance URL to enable outbound incident creation from findings.";

    case "confluence":
      if (humanStatus === "Disabled") {
        return "Confluence publishing is turned off for this deployment.";
      }

      if (humanStatus === "Ready") {
        return "Confluence Cloud settings are populated. Live publishing still requires a successful connection test.";
      }

      return "Configure Confluence Cloud URL, space, and credentials to publish review artifacts.";

    case "digests_advisory":
      if (humanStatus === "Ready") {
        return "Advisory schedules and digest subscriptions are enabled in this scope.";
      }

      return "Enable advisory schedules and digest subscriptions to deliver recurring architecture digests.";

    default:
      return connector.summary;
  }
}

export function connectorPurposeGroupId(connectorKey: string): ConnectorPurposeGroupId {
  return CONNECTOR_GROUP_BY_KEY[connectorKey] ?? "technical";
}

export function connectorCardTitle(connector: ConnectorSurfaceStatusDto): string {
  return CONNECTOR_CARD_TITLES[connector.connectorKey] ?? connector.displayName;
}

export function groupConnectorsByPurpose(
  connectors: readonly ConnectorSurfaceStatusDto[],
): Map<ConnectorPurposeGroupId, ConnectorSurfaceStatusDto[]> {
  const grouped = new Map<ConnectorPurposeGroupId, ConnectorSurfaceStatusDto[]>();

  for (const group of CONNECTOR_PURPOSE_GROUPS) {
    grouped.set(group.id, []);
  }

  for (const connector of connectors) {
    const groupId = connectorPurposeGroupId(connector.connectorKey);
    const bucket = grouped.get(groupId);

    if (bucket !== undefined) {
      bucket.push(connector);
    }
  }

  return grouped;
}

export type ConnectorDisplayStatusTag = {
  readonly kind: EnterpriseStatusKind;
  readonly label: string;
};

export function resolveConnectorDisplayStatusTag(status: ConnectorDisplayStatus): ConnectorDisplayStatusTag {
  switch (status) {
    case "Ready":
      return { kind: "ready", label: "Ready" };

    case "Recommended":
      return { kind: "needs-attention", label: "Recommended" };

    case "Optional":
      return { kind: "neutral", label: "Optional" };

    case "Not configured":
      return { kind: "draft", label: "Not configured" };

    case "Disabled":
      return { kind: "blocked", label: "Disabled" };

    case "Needs attention":
      return { kind: "needs-attention", label: "Action needed" };

    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function displayStatusBadgeClass(status: ConnectorDisplayStatus): string {
  if (status === "Ready") {
    return "border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-200";
  }

  if (status === "Recommended") {
    return "border-sky-300 text-sky-900 dark:border-sky-800 dark:text-sky-100";
  }

  if (status === "Disabled" || status === "Not configured" || status === "Optional") {
    return "border-neutral-300 text-neutral-600 dark:border-neutral-600 dark:text-neutral-400";
  }

  return "border-amber-400 text-amber-950 dark:border-amber-700 dark:text-amber-100";
}

/** @deprecated Use {@link displayStatusBadgeClass}. */
export function humanStatusBadgeClass(status: ConnectorHumanStatus): string {
  if (status === "Ready") {
    return displayStatusBadgeClass("Ready");
  }

  if (status === "Disabled" || status === "Not configured") {
    return displayStatusBadgeClass("Not configured");
  }

  if (status === "Configuration incomplete") {
    return displayStatusBadgeClass("Optional");
  }

  return displayStatusBadgeClass("Needs attention");
}

export function resolveIntegrationEventBusHumanStatus(bus: IntegrationEventBusStatusDto): ConnectorHumanStatus {
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

export function resolveIntegrationEventBusDisplayStatus(bus: IntegrationEventBusStatusDto): ConnectorDisplayStatus {
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

export function resolveIntegrationEventBusGuidance(bus: IntegrationEventBusStatusDto, humanStatus: ConnectorHumanStatus): string {
  if (humanStatus === "Ready") {
    return "Background delivery is configured for this deployment.";
  }

  if (humanStatus === "Configuration incomplete") {
    return "Background delivery is partially configured. Finish publisher and consumer settings before relying on asynchronous integration events.";
  }

  return "Only required for asynchronous integration events. Standard review workflows do not require this.";
}

export function formatIntegrationEventBusTechnicalDetails(bus: IntegrationEventBusStatusDto): string {
  const publisher = bus.publisherConfigured ? "configured" : "not configured";
  const outbox = bus.transactionalOutboxEnabled ? "enabled" : "off";
  const consumer = bus.consumerConfigured ? "configured" : "off";
  const queue = bus.queueOrTopicName ?? "—";
  const namespace = bus.fullyQualifiedNamespace ?? "—";
  const legacy = bus.usesLegacyConnectionString ? "present" : "absent";

  return `Publisher: ${publisher} · Transactional outbox: ${outbox} · Consumer: ${consumer} · Queue/topic: ${queue} · Namespace: ${namespace} · Legacy connection string: ${legacy}`;
}
