import { describe, expect, it } from "vitest";

import { resolveContinueLastDigestSubscription } from "@/lib/resolve-continue-last-digest-subscription";
import type { DigestSubscription } from "@/types/digest-subscriptions";

function subscription(overrides: Partial<DigestSubscription> = {}): DigestSubscription {
  return {
    subscriptionId: "sub-1",
    tenantId: "t1",
    workspaceId: "w1",
    projectId: "p1",
    name: "Ops mailbox",
    channelType: "Email",
    destination: "ops@example.com",
    isEnabled: true,
    createdUtc: "2026-08-01T00:00:00.000Z",
    lastDeliveredUtc: null,
    metadataJson: "{}",
    ...overrides,
  };
}

describe("resolveContinueLastDigestSubscription", () => {
  it("returns null when input is not an array", () => {
    expect(resolveContinueLastDigestSubscription(null)).toBeNull();
    expect(resolveContinueLastDigestSubscription({})).toBeNull();
    expect(resolveContinueLastDigestSubscription("nope")).toBeNull();
    expect(resolveContinueLastDigestSubscription([])).toBeNull();
  });

  it("falls back to the most recently delivered subscription when no stored id exists", () => {
    const match = resolveContinueLastDigestSubscription([
      subscription({
        subscriptionId: "older",
        name: "Older",
        lastDeliveredUtc: "2026-08-01T00:00:00.000Z",
      }),
      subscription({
        subscriptionId: "newer",
        name: "Newer",
        lastDeliveredUtc: "2026-08-20T00:00:00.000Z",
      }),
    ]);

    expect(match?.subscriptionId).toBe("newer");
    expect(match?.name).toBe("Newer");
  });
});
