import { afterEach, describe, expect, it, vi } from "vitest";

import { startBillingPortal } from "@/lib/billing-portal-client";

describe("startBillingPortal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("redirects when portal URL is returned", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", {
      location: { origin: "https://app.example.com", assign },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ portalUrl: "https://billing.stripe.com/session/test" }),
      }),
    );

    const result = await startBillingPortal();

    expect(result).toBe("redirected");
    expect(assign).toHaveBeenCalledWith("https://billing.stripe.com/session/test");
  });

  it("returns failed when response is not ok", async () => {
    vi.stubGlobal("window", { location: { origin: "https://app.example.com", assign: vi.fn() } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ title: "No Stripe customer" }),
      }),
    );

    const result = await startBillingPortal();

    expect(result).toBe("failed");
  });
});
