import {
  isConnectorReady,
  isDisabledConnector,
  isOptionalConnector,
  isRecommendedConnector,
  resolveConnectorDisplayStatus,
  resolveIntegrationEventBusDisplayStatus,
  type ConnectorDisplayStatus,
} from "@/lib/connector-operations-present";
import type {
  ConnectorSurfaceStatusDto,
  IntegrationEventBusStatusDto,
  TenantIntegrationsOperationsDto,
} from "@/types/operate-rhythm";

export type IntegrationReadinessSummaryTile = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly tone: "healthy" | "neutral" | "attention" | "disabled";
};

export type IntegrationRecommendedNextStep = {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly href: string | null;
};

export function resolveIntegrationReadinessHeadline(
  connectors: readonly ConnectorSurfaceStatusDto[],
  eventBus: IntegrationEventBusStatusDto,
): string {
  const needsAttention = connectors.some(
    (connector) => resolveConnectorDisplayStatus(connector) === "Needs attention",
  );

  if (needsAttention) {
    return "Core review workflows are ready. Resolve integrations marked needs attention before relying on them in production.";
  }

  const eventBusStatus = resolveIntegrationEventBusDisplayStatus(eventBus);

  if (eventBusStatus === "Needs attention") {
    return "Core review workflows are ready. Background delivery needs attention before asynchronous integration events can run.";
  }

  return "Core review workflows are ready. Optional delivery channels can be configured when needed.";
}

function tileToneForStatus(status: ConnectorDisplayStatus): IntegrationReadinessSummaryTile["tone"] {
  if (status === "Ready") {
    return "healthy";
  }

  if (status === "Disabled") {
    return "disabled";
  }

  if (status === "Needs attention") {
    return "attention";
  }

  return "neutral";
}

export function buildIntegrationReadinessSummaryTiles(
  data: TenantIntegrationsOperationsDto,
): readonly IntegrationReadinessSummaryTile[] {
  const readyConnectors = data.connectors.filter((connector) => isConnectorReady(connector)).length;
  const eventBusReady = resolveIntegrationEventBusDisplayStatus(data.integrationEventBus) === "Ready";
  const readyCount = readyConnectors + (eventBusReady ? 1 : 0);

  const recommendedRemaining = data.connectors.filter(
    (connector) =>
      isRecommendedConnector(connector.connectorKey) && !isConnectorReady(connector) && !isDisabledConnector(connector),
  ).length;

  const optionalNotConfigured = data.connectors.filter((connector) => {
    if (!isOptionalConnector(connector.connectorKey) || isDisabledConnector(connector)) {
      return false;
    }

    const status = resolveConnectorDisplayStatus(connector);

    return status === "Not configured" || status === "Optional";
  }).length;

  const disabledCount = data.connectors.filter((connector) => isDisabledConnector(connector)).length;
  const backgroundStatus = resolveIntegrationEventBusDisplayStatus(data.integrationEventBus);

  return [
    {
      id: "ready",
      label: "Ready integrations",
      value: String(readyCount),
      tone: readyCount > 0 ? "healthy" : "neutral",
    },
    {
      id: "recommended",
      label: "Recommended setup remaining",
      value: String(recommendedRemaining),
      tone: recommendedRemaining > 0 ? "attention" : "healthy",
    },
    {
      id: "optional",
      label: "Optional not configured",
      value: String(optionalNotConfigured),
      tone: "neutral",
    },
    {
      id: "disabled",
      label: "Disabled integrations",
      value: String(disabledCount),
      tone: disabledCount > 0 ? "disabled" : "neutral",
    },
    {
      id: "background",
      label: "Background delivery",
      value: backgroundStatus,
      tone: tileToneForStatus(backgroundStatus),
    },
  ];
}

function firstConfigurationHref(
  connectors: readonly ConnectorSurfaceStatusDto[],
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const connector = connectors.find((row) => row.connectorKey === key);

    if (connector?.configurationHref) {
      return connector.configurationHref;
    }
  }

  return null;
}

export function buildIntegrationRecommendedNextSteps(
  data: TenantIntegrationsOperationsDto,
): readonly IntegrationRecommendedNextStep[] {
  const steps: IntegrationRecommendedNextStep[] = [];
  const teamsReady = isConnectorReady(data.connectors.find((row) => row.connectorKey === "teams") ?? null);
  const slackReady = isConnectorReady(data.connectors.find((row) => row.connectorKey === "slack") ?? null);

  if (!teamsReady && !slackReady) {
    steps.push({
      id: "notify-team",
      title: "Configure Microsoft Teams or Slack for review notifications",
      detail: "Recommended when stakeholders should receive review outcomes in a collaboration channel.",
      href: firstConfigurationHref(data.connectors, ["teams", "slack"]),
    });
  }

  const jiraReady = isConnectorReady(data.connectors.find((row) => row.connectorKey === "jira") ?? null);
  const serviceNowReady = isConnectorReady(data.connectors.find((row) => row.connectorKey === "servicenow") ?? null);

  if (!jiraReady && !serviceNowReady) {
    steps.push({
      id: "create-tickets",
      title: "Configure Jira or ServiceNow if findings should create tickets",
      detail: "Optional — enable outbound ticketing when your workflow needs backlog or incident records.",
      href: firstConfigurationHref(data.connectors, ["jira", "servicenow"]),
    });
  }

  const eventBusReady = resolveIntegrationEventBusDisplayStatus(data.integrationEventBus) === "Ready";

  if (!eventBusReady) {
    steps.push({
      id: "event-bus",
      title: "Enable background delivery only when asynchronous events are required",
      detail: "Standard review workflows do not require the event bus. Configure it for advanced integration delivery.",
      href: null,
    });
  }

  return steps.slice(0, 3);
}
