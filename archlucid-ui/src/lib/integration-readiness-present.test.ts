import { describe, expect, it } from "vitest";

import {
  formatIntegrationReadinessLastChecked,
  resolveConnectorConfigureHelper,
  resolveConnectorDetailsLabel,
  resolveConnectorRowActionLabel,
  resolveIntegrationBackgroundDeliveryLabel,
} from "@/lib/integration-readiness-present";
import type { IntegrationEventBusStatusDto } from "@/types/operate-rhythm";

function eventBus(partial: Partial<IntegrationEventBusStatusDto> = {}): IntegrationEventBusStatusDto {
  return {
    publisherConfigured: false,
    transactionalOutboxEnabled: false,
    consumerConfigured: false,
    usesLegacyConnectionString: false,
    smokeReadiness: "NotConfigured",
    ...partial,
  };
}

describe("integration-readiness-present", () => {
  it("maps event bus readiness to plain-language background delivery labels", () => {
    expect(resolveIntegrationBackgroundDeliveryLabel(eventBus({ smokeReadiness: "LocallyValid" }))).toBe("Configured");
    expect(resolveIntegrationBackgroundDeliveryLabel(eventBus({ smokeReadiness: "NotConfigured" }))).toBe("Not required");
    expect(resolveIntegrationBackgroundDeliveryLabel(eventBus({ smokeReadiness: "ConfigurationIncomplete" }))).toBe(
      "Not configured",
    );
  });

  it("uses descriptive configure helpers and detail labels", () => {
    expect(resolveConnectorConfigureHelper("teams")).toMatch(/channel/i);
    expect(resolveConnectorDetailsLabel("Ready", false)).toBe("What this enables");
    expect(resolveConnectorDetailsLabel("Recommended", true)).toBe("View requirements");
    expect(resolveConnectorDetailsLabel("Not configured", false)).toBe("View setup details");
    expect(resolveConnectorRowActionLabel("Recommended", false, "/integrations/teams")).toBe("Open setup");
  });

  it("labels configuration reads without implying a probe timestamp", () => {
    const readAt = new Date("2026-08-12T15:30:00.000Z");

    expect(formatIntegrationReadinessLastChecked(readAt)).toMatch(/^Configuration read at /);
    expect(formatIntegrationReadinessLastChecked(readAt)).not.toMatch(/^Last checked:/);
  });
});
