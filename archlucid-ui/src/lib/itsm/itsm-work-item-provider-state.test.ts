import { describe, expect, it } from "vitest";

import type { ItsmIntegrationHealthResponse } from "@/lib/api/itsm-outbound-api";
import {
  canNativeCreateWithItsmProvider,
  configuredItsmWorkItemProviders,
  hasAnyItsmWorkItemProviderConfigured,
  readyItsmWorkItemProviders,
  resolveItsmWorkItemProviderSnapshots,
  selectSingleConfiguredItsmWorkItemProvider,
  selectSingleReadyItsmWorkItemProvider,
} from "@/lib/itsm/itsm-work-item-provider-state";

function health(partial: ItsmIntegrationHealthResponse): ItsmIntegrationHealthResponse {
  return partial;
}

describe("itsm-work-item-provider-state", () => {
  it("reports neither provider configured when native is enabled but probes are absent", () => {
    const snapshots = resolveItsmWorkItemProviderSnapshots(
      health({
        nativeEnabled: true,
        jira: { locallyConfigured: false, summary: "skip" },
        serviceNow: { locallyConfigured: false, summary: "skip" },
      }),
    );

    expect(hasAnyItsmWorkItemProviderConfigured(snapshots)).toBe(false);
    expect(configuredItsmWorkItemProviders(snapshots)).toHaveLength(0);
    expect(selectSingleConfiguredItsmWorkItemProvider(snapshots)).toBeNull();
  });

  it("reports Jira only when ServiceNow is not configured", () => {
    const snapshots = resolveItsmWorkItemProviderSnapshots(
      health({
        nativeEnabled: true,
        jira: { locallyConfigured: true, reachable: true, summary: "ready" },
        serviceNow: { locallyConfigured: false, summary: "skip" },
      }),
    );

    expect(selectSingleConfiguredItsmWorkItemProvider(snapshots)).toBe("Jira");
    expect(selectSingleReadyItsmWorkItemProvider(snapshots)).toBe("Jira");
    expect(canNativeCreateWithItsmProvider(health({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      serviceNow: { locallyConfigured: false, summary: "skip" },
    }), "Jira")).toBe(true);
  });

  it("reports ServiceNow only when Jira is not configured", () => {
    const snapshots = resolveItsmWorkItemProviderSnapshots(
      health({
        nativeEnabled: true,
        jira: { locallyConfigured: false, summary: "skip" },
        serviceNow: { locallyConfigured: true, reachable: true, summary: "ready" },
      }),
    );

    expect(selectSingleConfiguredItsmWorkItemProvider(snapshots)).toBe("ServiceNow");
    expect(readyItsmWorkItemProviders(snapshots).map((entry) => entry.provider)).toEqual(["ServiceNow"]);
  });

  it("requires provider selection when both connectors are configured", () => {
    const snapshots = resolveItsmWorkItemProviderSnapshots(
      health({
        nativeEnabled: true,
        jira: { locallyConfigured: true, reachable: true, summary: "ready" },
        serviceNow: { locallyConfigured: true, reachable: true, summary: "ready" },
      }),
    );

    expect(configuredItsmWorkItemProviders(snapshots)).toHaveLength(2);
    expect(selectSingleConfiguredItsmWorkItemProvider(snapshots)).toBeNull();
    expect(selectSingleReadyItsmWorkItemProvider(snapshots)).toBeNull();
  });

  it("marks expired or invalid connections as configured but not ready", () => {
    const snapshots = resolveItsmWorkItemProviderSnapshots(
      health({
        nativeEnabled: true,
        jira: { locallyConfigured: true, reachable: false, summary: "token expired" },
        serviceNow: { locallyConfigured: false, summary: "skip" },
      }),
    );

    expect(hasAnyItsmWorkItemProviderConfigured(snapshots)).toBe(true);
    expect(readyItsmWorkItemProviders(snapshots)).toHaveLength(0);
    expect(snapshots.find((entry) => entry.provider === "Jira")?.state).toBe("invalidConnection");
    expect(canNativeCreateWithItsmProvider(health({
      nativeEnabled: true,
      jira: { locallyConfigured: true, reachable: false, summary: "token expired" },
    }), "Jira")).toBe(false);
  });

  it("fails closed when native deployment is disabled", () => {
    const snapshots = resolveItsmWorkItemProviderSnapshots(
      health({
        nativeEnabled: false,
        jira: { locallyConfigured: true, reachable: true, summary: "ready" },
      }),
    );

    expect(snapshots.every((entry) => entry.state === "deploymentDisabled")).toBe(true);
    expect(hasAnyItsmWorkItemProviderConfigured(snapshots)).toBe(false);
  });
});
