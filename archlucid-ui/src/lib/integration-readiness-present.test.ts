import { describe, expect, it } from "vitest";

import {
  resolveConnectorConfigureHelper,
  resolveConnectorDetailsLabel,
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
  });
});
