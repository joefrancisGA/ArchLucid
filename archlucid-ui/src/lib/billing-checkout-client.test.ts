import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BILLING_CHECKOUT_NOT_CONFIGURED_MESSAGE,
  BILLING_CHECKOUT_REQUEST_ACCEPTED_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

import { startBillingCheckout } from "@/lib/billing-checkout-client";

describe("startBillingCheckout", () => {
  beforeEach(() => {
    const locationAssign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, assign: locationAssign, origin: "https://app.example.com" },
    });
  });

  it("redirects when checkoutUrl is returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_abc" }), { status: 200 }),
      ),
    );

    const result = await startBillingCheckout({
      targetTier: "Team",
      returnUrl: "https://app.example.com/settings/billing?checkout=success",
      cancelUrl: "https://app.example.com/settings/billing?checkout=canceled",
    });

    expect(result).toEqual({ outcome: "redirected" });
    expect(window.location.assign).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_abc");
  });

  it("returns not_configured when API reports billing is not wired", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "not_configured" }), { status: 200 })),
    );

    const result = await startBillingCheckout({ targetTier: "Pro" });

    expect(result).toEqual({
      outcome: "not_configured",
      message: BILLING_CHECKOUT_NOT_CONFIGURED_MESSAGE,
    });
  });

  it("returns accepted when checkout succeeds without redirect URL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "ok" }), { status: 200 })));

    const result = await startBillingCheckout({ targetTier: "Pro" });

    expect(result).toEqual({
      outcome: "accepted",
      message: BILLING_CHECKOUT_REQUEST_ACCEPTED_MESSAGE,
    });
  });

  it("returns failed with message when API rejects checkout", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ title: "Billing unavailable" }), { status: 403 })),
    );

    const result = await startBillingCheckout({ targetTier: "Pro" });

    expect(result).toEqual({ outcome: "failed", message: "Billing unavailable" });
  });
});
