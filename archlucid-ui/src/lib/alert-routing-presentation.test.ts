import { describe, expect, it } from "vitest";

import {
  alertRoutingRowDeliveryStatus,
  formatAlertRoutingConfigProvenanceLine,
  latestAlertRoutingConfigRecordedUtc,
  summarizeAlertRoutingDeliveryHealth,
} from "@/lib/alert-routing-presentation";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

function subscription(
  overrides: Partial<AlertRoutingSubscription> = {},
): AlertRoutingSubscription {
  return {
    routingSubscriptionId: "sub-1",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    name: "Ops email",
    channelType: "Email",
    destination: "ops@example.com",
    minimumSeverity: "High",
    isEnabled: true,
    createdUtc: "2026-01-01T00:00:00.000Z",
    lastDeliveredUtc: null,
    metadataJson: "{}",
    ...overrides,
  };
}

describe("alert-routing-presentation", () => {
  it("maps row delivery status to StatusTag kinds", () => {
    expect(alertRoutingRowDeliveryStatus(subscription({ isEnabled: false }))).toEqual({
      kind: "neutral",
      label: "Disabled",
    });
    expect(alertRoutingRowDeliveryStatus(subscription({ lastDeliveredUtc: "2026-01-02T00:00:00.000Z" }))).toEqual({
      kind: "ready",
      label: "Delivering",
    });
    expect(alertRoutingRowDeliveryStatus(subscription())).toEqual({
      kind: "needs-attention",
      label: "Awaiting delivery",
    });
  });

  it("summarizes aggregate delivery health", () => {
    expect(summarizeAlertRoutingDeliveryHealth([])).toBeNull();
    expect(
      summarizeAlertRoutingDeliveryHealth([
        subscription({ isEnabled: false }),
        subscription({ routingSubscriptionId: "sub-2", isEnabled: false }),
      ]),
    ).toEqual({ kind: "neutral", label: "All destinations disabled" });
    expect(
      summarizeAlertRoutingDeliveryHealth([
        subscription({ lastDeliveredUtc: "2026-01-02T00:00:00.000Z" }),
        subscription({ routingSubscriptionId: "sub-2" }),
      ]),
    ).toEqual({
      kind: "needs-attention",
      label: "1 of 2 enabled destinations delivered",
    });
    expect(
      summarizeAlertRoutingDeliveryHealth([
        subscription({ lastDeliveredUtc: "2026-01-02T00:00:00.000Z" }),
        subscription({ routingSubscriptionId: "sub-2", isEnabled: false }),
      ]),
    ).toEqual({
      kind: "ready",
      label: "1 of 1 delivering",
    });
  });

  it("formats configuration provenance from the latest change", () => {
    expect(
      latestAlertRoutingConfigRecordedUtc([
        subscription({ createdUtc: "2026-01-01T00:00:00.000Z" }),
        subscription({ routingSubscriptionId: "sub-2", createdUtc: "2026-02-01T00:00:00.000Z" }),
      ]),
    ).toBe("2026-02-01T00:00:00.000Z");
    expect(formatAlertRoutingConfigProvenanceLine("2026-02-01T00:00:00.000Z", "alex@contoso.com")).toMatch(
      /Configuration last changed by alex@contoso.com/i,
    );
    expect(formatAlertRoutingConfigProvenanceLine("2026-02-01T00:00:00.000Z")).toMatch(
      /Configuration last recorded/i,
    );
    expect(formatAlertRoutingConfigProvenanceLine(null)).toBeNull();
  });
});
