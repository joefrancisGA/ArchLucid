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

export type ConnectorPurposeGroupId = "notifications" | "ticketing" | "publishing" | "technical";

export type ConnectorPurposeGroup = {
  id: ConnectorPurposeGroupId;
  title: string;
  description: string;
};

export const CONNECTOR_PURPOSE_GROUPS: readonly ConnectorPurposeGroup[] = [
  {
    id: "notifications",
    title: "Notifications",
    description: "Channels that deliver review and alert notifications to your team.",
  },
  {
    id: "ticketing",
    title: "Ticketing",
    description: "Optional connectors for creating outbound tickets from findings.",
  },
  {
    id: "publishing",
    title: "Publishing and digests",
    description: "Optional publishing to Confluence and scheduled architecture digests.",
  },
  {
    id: "technical",
    title: "Technical readiness",
    description: "Messaging infrastructure used by integration events.",
  },
] as const;

const OPTIONAL_TICKETING_KEYS = new Set<string>(["jira", "servicenow"]);
const OPTIONAL_PUBLISHING_KEYS = new Set<string>(["confluence", "digests_advisory"]);

const CONNECTOR_GROUP_BY_KEY: Record<string, ConnectorPurposeGroupId> = {
  teams: "notifications",
  slack: "notifications",
  outbound_webhooks: "notifications",
  jira: "ticketing",
  servicenow: "ticketing",
  confluence: "publishing",
  digests_advisory: "publishing",
};

const CONNECTOR_CARD_TITLES: Record<string, string> = {
  teams: "Microsoft Teams",
  slack: "Slack",
  outbound_webhooks: "Outbound HTTP webhooks",
  jira: "Jira ticketing",
  servicenow: "ServiceNow ticketing",
  confluence: "Confluence publishing",
  digests_advisory: "Architecture digests",
};

function isOptionalConnector(connectorKey: string): boolean {
  return OPTIONAL_TICKETING_KEYS.has(connectorKey) || OPTIONAL_PUBLISHING_KEYS.has(connectorKey);
}

function isDisabledConnector(connector: ConnectorSurfaceStatusDto): boolean {
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

export function formatConnectorStatusLabel(
  connector: ConnectorSurfaceStatusDto,
  humanStatus: ConnectorHumanStatus,
): string {
  if (!isOptionalConnector(connector.connectorKey)) {
    return humanStatus;
  }

  if (humanStatus === "Ready") {
    return "Optional — ready";
  }

  if (humanStatus === "Disabled") {
    return "Optional — disabled";
  }

  if (humanStatus === "Configuration incomplete") {
    return "Optional — configuration incomplete";
  }

  return "Optional — not configured";
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

export function humanStatusBadgeClass(status: ConnectorHumanStatus): string {
  if (status === "Ready") {
    return "border-emerald-300 text-emerald-800 dark:border-emerald-800 dark:text-emerald-200";
  }

  if (status === "Disabled" || status === "Not configured") {
    return "border-neutral-300 text-neutral-600 dark:border-neutral-600 dark:text-neutral-400";
  }

  if (status === "Configuration incomplete") {
    return "border-amber-300 text-amber-900 dark:border-amber-800 dark:text-amber-200";
  }

  return "border-amber-400 text-amber-950 dark:border-amber-700 dark:text-amber-100";
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

export function resolveIntegrationEventBusGuidance(bus: IntegrationEventBusStatusDto, humanStatus: ConnectorHumanStatus): string {
  if (humanStatus === "Ready") {
    return "Integration event messaging is configured for this deployment.";
  }

  if (humanStatus === "Configuration incomplete") {
    return "Integration event messaging is partially configured. Finish publisher and consumer settings before relying on async integration delivery.";
  }

  return "Integration event messaging is not configured. Background integration delivery requires queue or topic settings.";
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
