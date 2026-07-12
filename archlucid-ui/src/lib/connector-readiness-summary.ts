import {
  isConnectorReady,
  isDisabledConnector,
  isOptionalConnector,
  isRecommendedConnector,
  resolveConnectorDisplayStatus,
} from "@/lib/connector-operations-present";
import {
  resolveIntegrationBackgroundDeliveryLabel,
  type IntegrationBackgroundDeliveryLabel,
} from "@/lib/integration-readiness-present";
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

export type IntegrationRecommendedFirstSetup = {
  readonly title: string;
  readonly detail: string;
  readonly href: string | null;
  readonly configureHelper: string | null;
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

  const backgroundLabel = resolveIntegrationBackgroundDeliveryLabel(eventBus);

  if (backgroundLabel === "Not configured") {
    return "Core review workflows are ready. Background delivery needs attention before asynchronous integration events can run.";
  }

  const anyReady = connectors.some((connector) => isConnectorReady(connector));

  if (!anyReady) {
    return "Core review workflows are ready. Integrations are optional.";
  }

  return "Core review workflows are ready. Optional delivery channels can be configured when needed.";
}

export const INTEGRATION_READINESS_OPTIONAL_SUPPORTING_COPY =
  "You can complete architecture reviews without configuring integrations." as const;

function tileToneForBackground(label: IntegrationBackgroundDeliveryLabel): IntegrationReadinessSummaryTile["tone"] {
  if (label === "Configured") {
    return "healthy";
  }

  if (label === "Not configured") {
    return "attention";
  }

  return "neutral";
}

export function buildIntegrationReadinessSummaryTiles(
  data: TenantIntegrationsOperationsDto,
): readonly IntegrationReadinessSummaryTile[] {
  const readyConnectors = data.connectors.filter((connector) => isConnectorReady(connector)).length;
  const eventBusReady = resolveIntegrationBackgroundDeliveryLabel(data.integrationEventBus) === "Configured";
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
  const backgroundStatus = resolveIntegrationBackgroundDeliveryLabel(data.integrationEventBus);

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
      tone: tileToneForBackground(backgroundStatus),
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

export function buildIntegrationRecommendedFirstSetup(
  data: TenantIntegrationsOperationsDto,
): IntegrationRecommendedFirstSetup | null {
  const teamsReady = isConnectorReady(data.connectors.find((row) => row.connectorKey === "teams") ?? null);
  const slackReady = isConnectorReady(data.connectors.find((row) => row.connectorKey === "slack") ?? null);

  if (!teamsReady && !slackReady) {
    return {
      title: "Configure Teams or Slack to send review notifications.",
      detail: "Recommended when stakeholders should receive review outcomes in a collaboration channel.",
      href: firstConfigurationHref(data.connectors, ["teams", "slack"]),
      configureHelper: "Send review notifications to a channel.",
    };
  }

  return null;
}

/** @deprecated Use {@link buildIntegrationRecommendedFirstSetup}. */
export function buildIntegrationRecommendedNextSteps(
  data: TenantIntegrationsOperationsDto,
): readonly IntegrationRecommendedFirstSetup[] {
  const first = buildIntegrationRecommendedFirstSetup(data);

  if (first === null) {
    return [];
  }

  return [first];
}
