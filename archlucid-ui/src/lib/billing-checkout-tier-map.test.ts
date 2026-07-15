import { describe, expect, it } from "vitest";

import {
  isSelfServeBillingCheckoutPlan,
  resolveBillingCheckoutTargetTier,
} from "@/lib/billing-checkout-tier-map";

describe("billing-checkout-tier-map", () => {
  it("maps architect and team catalog ids to distinct checkout tiers", () => {
    expect(resolveBillingCheckoutTargetTier("architect")).toBe("Architect");
    expect(resolveBillingCheckoutTargetTier("team")).toBe("Team");
  });

  it("maps professional to Pro and enterprise to Enterprise", () => {
    expect(resolveBillingCheckoutTargetTier("professional")).toBe("Pro");
    expect(resolveBillingCheckoutTargetTier("enterprise")).toBe("Enterprise");
  });

  it("limits self-serve checkout to architect and team", () => {
    expect(isSelfServeBillingCheckoutPlan("enterprise")).toBe(false);
    expect(isSelfServeBillingCheckoutPlan("professional")).toBe(false);
    expect(isSelfServeBillingCheckoutPlan("team")).toBe(true);
    expect(isSelfServeBillingCheckoutPlan("architect")).toBe(true);
  });
});
