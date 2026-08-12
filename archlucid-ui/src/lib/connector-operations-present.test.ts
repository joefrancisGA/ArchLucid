import { describe, expect, it } from "vitest";

import {
  formatConnectorCustomerSummary,
  formatConnectorDisplayStatus,
  groupConnectorsByPurpose,
  resolveConnectorGuidance,
  resolveConnectorHumanStatus,
  resolveIntegrationEventBusDisplayStatus,
  resolveIntegrationEventBusGuidance,
  resolveIntegrationEventBusHumanStatus,
} from "@/lib/connector-operations-present";
import {
  buildIntegrationReadinessSummaryTiles,
  buildIntegrationRecommendedFirstSetup,
  buildIntegrationRecommendedNextSteps,
  resolveIntegrationReadinessHeadline,
} from "@/lib/connector-readiness-summary";
import type { ConnectorSurfaceStatusDto, IntegrationEventBusStatusDto, TenantIntegrationsOperationsDto } from "@/types/operate-rhythm";

function connector(partial: Partial<ConnectorSurfaceStatusDto> & Pick<ConnectorSurfaceStatusDto, "connectorKey">): ConnectorSurfaceStatusDto {
  return {
    displayName: partial.connectorKey,
    isConfigured: partial.isConfigured ?? false,
    smokeReadiness: partial.smokeReadiness ?? "NotConfigured",
    summary: partial.summary ?? "",
    configurationHref: partial.configurationHref ?? null,
    ...partial,
  };
}

function operationsData(
  connectors: ConnectorSurfaceStatusDto[],
  bus: IntegrationEventBusStatusDto = {
    publisherConfigured: false,
    transactionalOutboxEnabled: false,
    consumerConfigured: false,
    usesLegacyConnectionString: false,
    smokeReadiness: "NotConfigured",
  },
): TenantIntegrationsOperationsDto {
  return { connectors, integrationEventBus: bus };
}

describe("connector-operations-present", () => {
  it("maps backend readiness enums to human statuses", () => {
    expect(
      resolveConnectorHumanStatus(
        connector({ connectorKey: "teams", smokeReadiness: "LocallyValid", isConfigured: true }),
      ),
    ).toBe("Ready");

    expect(
      resolveConnectorHumanStatus(
        connector({ connectorKey: "jira", smokeReadiness: "ConfigurationIncomplete" }),
      ),
    ).toBe("Configuration incomplete");
  });

  it("labels optional ticketing connectors without defect framing", () => {
    const jira = connector({ connectorKey: "jira", smokeReadiness: "NotConfigured" });

    expect(formatConnectorDisplayStatus(jira)).toBe("Not configured");
    expect(resolveConnectorGuidance(jira, resolveConnectorHumanStatus(jira))).toMatch(/Jira Cloud base URL/i);
  });

  it("labels recommended notification connectors as Recommended when not ready", () => {
    const teams = connector({ connectorKey: "teams", smokeReadiness: "NotConfigured" });

    expect(formatConnectorDisplayStatus(teams)).toBe("Recommended");
  });

  it("labels partially configured optional connectors as Optional", () => {
    const jira = connector({ connectorKey: "jira", smokeReadiness: "ConfigurationIncomplete" });

    expect(formatConnectorDisplayStatus(jira)).toBe("Optional");
  });

  it("marks disabled Confluence publishing as Disabled", () => {
    const confluence = connector({
      connectorKey: "confluence",
      smokeReadiness: "ConfigurationIncomplete",
      summary: "Confluence publishing is disabled in Integrations:ConfluencePublishing:Enabled.",
    });

    expect(resolveConnectorHumanStatus(confluence)).toBe("Disabled");
    expect(formatConnectorDisplayStatus(confluence)).toBe("Disabled");
    expect(formatConnectorCustomerSummary(confluence)).toBe(
      "Confluence publishing is disabled for this deployment.",
    );
  });

  it("groups connectors by user-intent sections", () => {
    const grouped = groupConnectorsByPurpose([
      connector({ connectorKey: "teams" }),
      connector({ connectorKey: "outbound_webhooks" }),
      connector({ connectorKey: "jira" }),
      connector({ connectorKey: "confluence" }),
    ]);

    expect(grouped.get("notifications")?.map((row) => row.connectorKey)).toEqual(["teams", "outbound_webhooks"]);
    expect(grouped.get("ticketing")?.map((row) => row.connectorKey)).toEqual(["jira"]);
    expect(grouped.get("publishing")?.map((row) => row.connectorKey)).toEqual(["confluence"]);
  });

  it("summarizes integration event bus readiness in customer language", () => {
    const bus: IntegrationEventBusStatusDto = {
      publisherConfigured: false,
      transactionalOutboxEnabled: false,
      consumerConfigured: false,
      usesLegacyConnectionString: false,
      smokeReadiness: "NotConfigured",
    };
    const humanStatus = resolveIntegrationEventBusHumanStatus(bus);

    expect(resolveIntegrationEventBusDisplayStatus(bus)).toBe("Not configured");
    expect(resolveIntegrationEventBusGuidance(bus, humanStatus)).toMatch(/Standard review workflows do not require this/i);
  });
});

describe("connector-readiness-summary", () => {
  it("builds summary tiles and a reassuring headline for default workspace", () => {
    const data = operationsData([
      connector({ connectorKey: "teams", smokeReadiness: "NotConfigured", configurationHref: "/integrations/teams" }),
      connector({ connectorKey: "jira", smokeReadiness: "NotConfigured", configurationHref: "/integrations/jira" }),
    ]);

    expect(resolveIntegrationReadinessHeadline(data.connectors, data.integrationEventBus)).toMatch(
      /Core review workflows are ready\. Integrations are optional\./i,
    );

    const tiles = buildIntegrationReadinessSummaryTiles(data);
    expect(tiles.find((tile) => tile.id === "connected")?.label).toBe("Integrations connected");
    expect(tiles.find((tile) => tile.id === "connected")?.value).toBe("0 of 2 — none required");
    expect(tiles.find((tile) => tile.id === "recommended")?.value).toBe("1");
    expect(tiles.find((tile) => tile.id === "optional")?.value).toBe("1");
    expect(tiles.find((tile) => tile.id === "background")?.value).toBe("Not required");
  });

  it("keeps the of-total framing on the connected tile once an integration is ready", () => {
    const data = operationsData([
      connector({ connectorKey: "teams", smokeReadiness: "LocallyValid", isConfigured: true, configurationHref: "/integrations/teams" }),
      connector({ connectorKey: "jira", smokeReadiness: "NotConfigured", configurationHref: "/integrations/jira" }),
    ]);

    const tiles = buildIntegrationReadinessSummaryTiles(data);

    expect(tiles.find((tile) => tile.id === "connected")?.value).toBe("1 of 2");
  });

  it("surfaces a single recommended first setup for notification connectors", () => {
    const data = operationsData([
      connector({ connectorKey: "teams", smokeReadiness: "NotConfigured", configurationHref: "/integrations/teams" }),
      connector({ connectorKey: "jira", smokeReadiness: "NotConfigured", configurationHref: "/integrations/jira" }),
    ]);

    const setup = buildIntegrationRecommendedFirstSetup(data);

    expect(setup?.title).toMatch(/Configure Teams or Slack/i);
    expect(setup?.href).toBe("/integrations/teams");
    expect(setup?.actionLabel).toBe("Configure Teams notifications");
  });

  it("omits recommended first setup when Teams or Slack is ready", () => {
    const data = operationsData([
      connector({ connectorKey: "teams", smokeReadiness: "LocallyValid", isConfigured: true, configurationHref: "/integrations/teams" }),
      connector({ connectorKey: "slack", smokeReadiness: "NotConfigured", configurationHref: "/integrations/slack" }),
    ]);

    expect(buildIntegrationRecommendedFirstSetup(data)).toBeNull();
  });

  it("deprecated next-steps helper returns at most one item", () => {
    const data = operationsData([
      connector({ connectorKey: "teams", smokeReadiness: "NotConfigured", configurationHref: "/integrations/teams" }),
    ]);

    const steps = buildIntegrationRecommendedNextSteps(data);

    expect(steps).toHaveLength(1);
    expect(steps[0]?.href).toBe("/integrations/teams");
  });
});
