import { describe, expect, it } from "vitest";

import { resolveContinueLastWebhookSubscription } from "@/lib/resolve-continue-last-webhook-subscription";
import type { AlertRoutingSubscription } from "@/types/alert-routing";

function subscription(overrides: Partial<AlertRoutingSubscription> = {}): AlertRoutingSubscription {
  return {
    routingSubscriptionId: "sub-1",
    tenantId: "t1",
    workspaceId: "w1",
    projectId: "p1",
    name: "Ops webhook",
    channelType: "OnCallWebhook",
    destination: "https://listener.example/hook",
    minimumSeverity: "High",
    isEnabled: true,
    createdUtc: "2026-08-01T00:00:00.000Z",
    lastDeliveredUtc: null,
    metadataJson: "{}",
    ...overrides,
  };
}

describe("resolveContinueLastWebhookSubscription", () => {
  it("falls back to the newest enabled subscription when no stored id exists", () => {
    window.localStorage.removeItem("archlucid_webhook_subscription_continue_last_v1");

    const match = resolveContinueLastWebhookSubscription([
      subscription({
        routingSubscriptionId: "disabled-new",
        name: "Disabled new",
        isEnabled: false,
        createdUtc: "2026-08-20T00:00:00.000Z",
      }),
      subscription({
        routingSubscriptionId: "enabled-old",
        name: "Enabled old",
        isEnabled: true,
        createdUtc: "2026-01-01T00:00:00.000Z",
      }),
      subscription({
        routingSubscriptionId: "enabled-new",
        name: "Enabled new",
        isEnabled: true,
        createdUtc: "2026-08-01T00:00:00.000Z",
      }),
    ]);

    expect(match?.subscriptionId).toBe("enabled-new");
    expect(match?.name).toBe("Enabled new");
  });
});
