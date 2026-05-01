import { describe, expect, it } from "vitest";

import { isUsableTeamStripeCheckoutUrl } from "./team-stripe-checkout-url";

describe("isUsableTeamStripeCheckoutUrl", () => {
  it("returns false for nullish, whitespace, repo placeholder token, or generic checkout-placeholder", () => {
    expect(isUsableTeamStripeCheckoutUrl(null)).toBe(false);
    expect(isUsableTeamStripeCheckoutUrl(undefined)).toBe(false);
    expect(isUsableTeamStripeCheckoutUrl("   ")).toBe(false);
    expect(isUsableTeamStripeCheckoutUrl("https://checkout.stripe.com/placeholder-replace-before-launch")).toBe(false);
    expect(isUsableTeamStripeCheckoutUrl("https://pay.example/checkout-placeholder/session")).toBe(false);
  });

  it("returns true for trimmed real Stripe URLs (including test checkout)", () => {
    expect(isUsableTeamStripeCheckoutUrl("https://checkout.stripe.com/c/pay/cs_test_xyz")).toBe(true);
    expect(isUsableTeamStripeCheckoutUrl("https://pay.example.test/checkout")).toBe(true);
  });
});
