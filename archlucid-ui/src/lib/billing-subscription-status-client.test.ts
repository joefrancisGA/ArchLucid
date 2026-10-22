import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchBillingSubscriptionStatus } from "@/lib/billing-subscription-status-client";

describe("fetchBillingSubscriptionStatus", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed status when response is ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          hasSubscription: true,
          provider: "stripe",
          tierCode: "Standard",
          status: "Suspended",
          isPaymentPastDue: true,
        }),
      }),
    );

    const status = await fetchBillingSubscriptionStatus();

    expect(status).toEqual({
      hasSubscription: true,
      provider: "stripe",
      tierCode: "Standard",
      status: "Suspended",
      isPaymentPastDue: true,
    });
  });

  it("returns null when response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      }),
    );

    const status = await fetchBillingSubscriptionStatus();

    expect(status).toBeNull();
  });
});
