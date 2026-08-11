import { describe, expect, it } from "vitest";

import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import {
  CONFIGURATION_SYSTEM_HEALTH_COMPACT_LINE,
  CONFIGURATION_SYSTEM_HEALTH_CONFIGURATION_LINK,
  CONFIGURATION_SYSTEM_HEALTH_HEADING,
  CONFIGURATION_SYSTEM_HEALTH_SYSTEM_HEALTH_LINK,
  CONFIGURATION_SYSTEM_HEALTH_WHY_TWO,
  buildConfigurationSystemHealthVocabulary,
  resolveConfigurationSystemHealthPeerLink,
} from "@/lib/configuration-system-health-vocabulary";
import { INTERNAL_CONFIGURATION_PATH } from "@/lib/internal-ops-route-paths";

describe("configuration-system-health-vocabulary (TB-2279)", () => {
  it("explains configuration knobs vs system health probes and deep-links both", () => {
    const model = buildConfigurationSystemHealthVocabulary();

    expect(model.heading).toBe(CONFIGURATION_SYSTEM_HEALTH_HEADING);
    expect(model.heading.toLowerCase()).toContain("configuration");
    expect(model.heading.toLowerCase()).toContain("system health");
    expect(model.whyTwo).toBe(CONFIGURATION_SYSTEM_HEALTH_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("knob");
    expect(model.whyTwo.toLowerCase()).toContain("probe");
    expect(model.compactLine).toBe(CONFIGURATION_SYSTEM_HEALTH_COMPACT_LINE);

    expect(model.configurationLink).toEqual(CONFIGURATION_SYSTEM_HEALTH_CONFIGURATION_LINK);
    expect(model.configurationLink.href).toBe(INTERNAL_CONFIGURATION_PATH);
    expect(model.configurationLink.href).toBe("/internal/configuration");

    expect(model.systemHealthLink).toEqual(CONFIGURATION_SYSTEM_HEALTH_SYSTEM_HEALTH_LINK);
    expect(model.systemHealthLink.href).toBe(ADMINISTRATION_SYSTEM_HEALTH_PATH);
    expect(model.systemHealthLink.href).toBe("/administration/system-health");
  });

  it("resolves the peer surface from configuration summary and system health", () => {
    expect(resolveConfigurationSystemHealthPeerLink("configuration-summary")).toEqual(
      CONFIGURATION_SYSTEM_HEALTH_SYSTEM_HEALTH_LINK,
    );

    expect(resolveConfigurationSystemHealthPeerLink("system-health")).toEqual(
      CONFIGURATION_SYSTEM_HEALTH_CONFIGURATION_LINK,
    );
  });
});
