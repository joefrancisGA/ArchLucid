import { describe, expect, it } from "vitest";

import {
  formatConnectorStatusLabel,
  groupConnectorsByPurpose,
  resolveConnectorGuidance,
  resolveConnectorHumanStatus,
  resolveIntegrationEventBusGuidance,
  resolveIntegrationEventBusHumanStatus,
} from "@/lib/connector-operations-present";
import type { ConnectorSurfaceStatusDto, IntegrationEventBusStatusDto } from "@/types/operate-rhythm";

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

  it("labels optional ticketing connectors without blocker framing", () => {
    const jira = connector({ connectorKey: "jira", smokeReadiness: "NotConfigured" });
    const humanStatus = resolveConnectorHumanStatus(jira);

    expect(formatConnectorStatusLabel(jira, humanStatus)).toBe("Optional — not configured");
    expect(resolveConnectorGuidance(jira, humanStatus)).toMatch(/Jira Cloud base URL/i);
  });

  it("marks disabled Confluence publishing as optional disabled", () => {
    const confluence = connector({
      connectorKey: "confluence",
      smokeReadiness: "ConfigurationIncomplete",
      summary: "Confluence publishing is disabled in Integrations:ConfluencePublishing:Enabled.",
    });
    const humanStatus = resolveConnectorHumanStatus(confluence);

    expect(humanStatus).toBe("Disabled");
    expect(formatConnectorStatusLabel(confluence, humanStatus)).toBe("Optional — disabled");
  });

  it("groups connectors by purpose", () => {
    const grouped = groupConnectorsByPurpose([
      connector({ connectorKey: "teams" }),
      connector({ connectorKey: "jira" }),
      connector({ connectorKey: "confluence" }),
    ]);

    expect(grouped.get("notifications")?.map((row) => row.connectorKey)).toEqual(["teams"]);
    expect(grouped.get("ticketing")?.map((row) => row.connectorKey)).toEqual(["jira"]);
    expect(grouped.get("publishing")?.map((row) => row.connectorKey)).toEqual(["confluence"]);
  });

  it("summarizes integration event bus readiness in human language", () => {
    const bus: IntegrationEventBusStatusDto = {
      publisherConfigured: false,
      transactionalOutboxEnabled: false,
      consumerConfigured: false,
      usesLegacyConnectionString: false,
      smokeReadiness: "NotConfigured",
    };
    const humanStatus = resolveIntegrationEventBusHumanStatus(bus);

    expect(humanStatus).toBe("Not configured");
    expect(resolveIntegrationEventBusGuidance(bus, humanStatus)).toMatch(/not configured/i);
  });
});
