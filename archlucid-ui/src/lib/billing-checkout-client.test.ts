import { beforeEach, describe, expect, it, vi } from "vitest";

const showError = vi.fn();
const showSuccess = vi.fn();

vi.mock("@/lib/toast", () => ({
  showError: (...args: unknown[]) => showError(...args),
  showSuccess: (...args: unknown[]) => showSuccess(...args),
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (init: RequestInit) => init,
}));

import { startBillingCheckout } from "@/lib/billing-checkout-client";

describe("startBillingCheckout", () => {
  beforeEach(() => {
    showError.mockClear();
    showSuccess.mockClear();
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
      cancelUrl: "https://app.example.com/settings/billing?checkout=cancelled",
    });

    expect(result).toBe("redirected");
    expect(window.location.assign).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_abc");
  });

  it("returns not_configured when API reports billing is not wired", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "not_configured" }), { status: 200 })),
    );

    const result = await startBillingCheckout({ targetTier: "Pro" });

    expect(result).toBe("not_configured");
    expect(showSuccess).toHaveBeenCalled();
  });
});
