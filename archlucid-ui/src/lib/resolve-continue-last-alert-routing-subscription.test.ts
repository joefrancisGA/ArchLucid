import { describe, expect, it } from "vitest";

import { resolveContinueLastAlertRoutingSubscription } from "@/lib/resolve-continue-last-alert-routing-subscription";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

function subscription(overrides: Partial<AlertRoutingSubscription> = {}): AlertRoutingSubscription {
  return {
    routingSubscriptionId: "sub-1",
    tenantId: "t1",
    workspaceId: "w1",
    projectId: "p1",
    name: "Ops email",
    channelType: "Email",
    destination: "ops@example.com",
    minimumSeverity: "High",
    isEnabled: true,
    createdUtc: "2026-08-01T00:00:00.000Z",
    lastDeliveredUtc: null,
    metadataJson: "{}",
    ...overrides,
  };
}

describe("resolveContinueLastAlertRoutingSubscription", () => {
  it("returns null when input is not an array", () => {
    expect(resolveContinueLastAlertRoutingSubscription(null)).toBeNull();
    expect(resolveContinueLastAlertRoutingSubscription({})).toBeNull();
    expect(resolveContinueLastAlertRoutingSubscription("nope")).toBeNull();
    expect(resolveContinueLastAlertRoutingSubscription([])).toBeNull();
  });

  it("falls back to the most recently delivered subscription when no stored id exists", () => {
    window.localStorage.removeItem("archlucid_alert_routing_subscription_continue_last_v1");

    const match = resolveContinueLastAlertRoutingSubscription([
      subscription({
        routingSubscriptionId: "older",
        name: "Older",
        lastDeliveredUtc: "2026-08-01T00:00:00.000Z",
      }),
      subscription({
        routingSubscriptionId: "newer",
        name: "Newer",
        lastDeliveredUtc: "2026-08-20T00:00:00.000Z",
      }),
    ]);

    expect(match?.subscriptionId).toBe("newer");
    expect(match?.name).toBe("Newer");
  });

  it("falls back to newest created when no deliveries exist", () => {
    window.localStorage.removeItem("archlucid_alert_routing_subscription_continue_last_v1");

    const match = resolveContinueLastAlertRoutingSubscription([
      subscription({
        routingSubscriptionId: "old",
        name: "Old",
        createdUtc: "2026-01-01T00:00:00.000Z",
      }),
      subscription({
        routingSubscriptionId: "new",
        name: "New",
        createdUtc: "2026-08-01T00:00:00.000Z",
      }),
    ]);

    expect(match?.subscriptionId).toBe("new");
    expect(match?.name).toBe("New");
  });
});
