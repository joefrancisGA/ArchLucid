import { describe, expect, it } from "vitest";

import type { ItsmIntegrationHealthResponse } from "@/lib/api/itsm-outbound-api";
import {
  isItsmNativeCreateDefaultPathReady,
  isItsmProviderProbeReady,
  resolveItsmOnboardingWizardInitialStep,
} from "@/lib/itsm/itsm-native-create-readiness";

describe("itsm-native-create-readiness", () => {
  it("requires locally configured and reachable probes", () => {
    expect(isItsmProviderProbeReady({ locallyConfigured: true, reachable: true, summary: "ok" })).toBe(true);
    expect(isItsmProviderProbeReady({ locallyConfigured: true, reachable: false, summary: "fail" })).toBe(false);
    expect(isItsmProviderProbeReady({ locallyConfigured: false, reachable: true, summary: "skip" })).toBe(false);
  });

  it("fails closed when native deployment flag is off", () => {
    const health: ItsmIntegrationHealthResponse = {
      nativeEnabled: false,
      jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    };

    expect(isItsmNativeCreateDefaultPathReady(health)).toBe(false);
  });

  it("enables default path when native flag is on and a vendor probe is ready", () => {
    const health: ItsmIntegrationHealthResponse = {
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    };

    expect(isItsmNativeCreateDefaultPathReady(health)).toBe(true);
  });

  it("lands wizard on runbooks when probes and tenant overrides are valid", () => {
    const health: ItsmIntegrationHealthResponse = {
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    };

    expect(
      resolveItsmOnboardingWizardInitialStep(health, {
        hasTenantOverrides: true,
        deploymentCredentials: { jiraConfigured: true },
      }),
    ).toBe("runbooks");
  });

  it("lands wizard on verify when creds exist but probes are not green", () => {
    const health: ItsmIntegrationHealthResponse = {
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: false, summary: "auth failed" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    };

    expect(
      resolveItsmOnboardingWizardInitialStep(health, {
        hasTenantOverrides: false,
        deploymentCredentials: { jiraConfigured: true },
      }),
    ).toBe("verify");
  });
});
