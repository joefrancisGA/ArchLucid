import { describe, expect, it } from "vitest";

import {
  channelDestinationHelper,
  formatDeliveryResult,
  isDigestSubscriptionFormValid,
  resolveSubscriptionStatusBadge,
  validateDigestSubscriptionDestination,
} from "@/lib/digest-subscription-form";
import type { DigestDeliveryAttempt, DigestSubscription } from "@/types/digest-subscriptions";

function sub(overrides: Partial<DigestSubscription> = {}): DigestSubscription {
  return {
    subscriptionId: "s1",
    tenantId: "t",
    workspaceId: "w",
    projectId: "p",
    name: "Ops digest",
    channelType: "Email",
    destination: "ops@example.com",
    isEnabled: true,
    createdUtc: "2026-07-01T00:00:00Z",
    metadataJson: "{}",
    ...overrides,
  };
}

describe("digest-subscription-form", () => {
  it("validates email and webhook destinations", () => {
    expect(validateDigestSubscriptionDestination("Email", "bad")).toMatch(/valid email/i);
    expect(validateDigestSubscriptionDestination("Email", "ops@example.com")).toBeNull();
    expect(validateDigestSubscriptionDestination("TeamsWebhook", "http://example.com")).toMatch(/HTTPS/i);
    expect(validateDigestSubscriptionDestination("SlackWebhook", "https://hooks.example.com/x")).toBeNull();
  });

  it("requires name and valid destination for form validity", () => {
    expect(
      isDigestSubscriptionFormValid({
        name: "",
        channelType: "Email",
        destination: "ops@example.com",
      }),
    ).toBe(false);
    expect(
      isDigestSubscriptionFormValid({
        name: "Ops",
        channelType: "Email",
        destination: "ops@example.com",
      }),
    ).toBe(true);
  });

  it("returns channel helper copy", () => {
    expect(channelDestinationHelper("Email")).toMatch(/mailbox/i);
    expect(channelDestinationHelper("TeamsWebhook")).toMatch(/HTTPS/i);
  });

  it("maps subscription status badges", () => {
    expect(resolveSubscriptionStatusBadge(sub({ isEnabled: false }), []).label).toBe("Paused");
    expect(resolveSubscriptionStatusBadge(sub(), []).label).toBe("Pending verification");

    const failed: DigestDeliveryAttempt[] = [
      {
        attemptId: "a1",
        digestId: "d1",
        subscriptionId: "s1",
        attemptedUtc: "2026-07-08T12:00:00Z",
        status: "Failed",
        errorMessage: "timeout",
        channelType: "Email",
        destination: "ops@example.com",
      },
    ];
    expect(resolveSubscriptionStatusBadge(sub(), failed).label).toBe("Failed");
    expect(formatDeliveryResult(failed)).toContain("Failed");
  });
});
