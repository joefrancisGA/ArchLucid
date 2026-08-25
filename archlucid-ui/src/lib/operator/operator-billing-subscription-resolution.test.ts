import { describe, expect, it } from "vitest";

import {
  resolveOperatorBillingCommercialTier,
  resolveOperatorBillingHasSubscriptionForInvoice,
  resolveOperatorBillingIsTrialUsage,
  resolveOperatorBillingSubscriptionLoadState,
  resolveOperatorBillingSubscriptionStatusDisplay,
} from "./operator-billing-subscription-resolution";

describe("operator-billing-subscription-resolution", () => {
  it("returns pending while subscription or usage queries are in flight", () => {
    expect(
      resolveOperatorBillingSubscriptionLoadState(true, false, false, true, null, { isTrial: true }),
    ).toBe("pending");
  });

  it("returns unavailable when both payloads are absent after fetch", () => {
    expect(resolveOperatorBillingSubscriptionLoadState(false, false, true, true, null, null)).toBe("unavailable");
  });

  it("stays pending when subscription finished with null before usage-status loads", () => {
    expect(
      resolveOperatorBillingSubscriptionLoadState(false, false, true, false, null, undefined),
    ).toBe("pending");
  });

  it("prefers usage commercial tier over subscription tier code", () => {
    expect(
      resolveOperatorBillingCommercialTier(
        { commercialTier: "Team" },
        { hasSubscription: true, isPaymentPastDue: false, tierCode: "architect" },
      ),
    ).toBe("Team");
  });

  it("aligns invoice subscription flag with explicit subscription payload", () => {
    expect(
      resolveOperatorBillingHasSubscriptionForInvoice(
        { hasSubscription: true, isPaymentPastDue: false },
        false,
      ),
    ).toBe(true);
  });

  it("maps resolved paid plan to active subscription status tag", () => {
    const display = resolveOperatorBillingSubscriptionStatusDisplay("resolved", true);
    expect(display.kind).toBe("ready");
    expect(display.label).toBe("Active subscription");
  });

  it("treats subscription hasSubscription as non-trial usage when usage omits isTrial", () => {
    expect(
      resolveOperatorBillingIsTrialUsage(
        { commercialTier: "Team" },
        { hasSubscription: true, isPaymentPastDue: false },
      ),
    ).toBe(false);
  });

  it("lets an active subscription override a stale trial flag in the usage payload", () => {
    const subscription = { hasSubscription: true, isPaymentPastDue: false } as const;
    const staleTrialUsage = { commercialTier: "Team", isTrial: true } as const;

    expect(resolveOperatorBillingIsTrialUsage(staleTrialUsage, subscription)).toBe(false);
    // The plan card and the next-invoice notice must never state opposite subscription facts.
    expect(resolveOperatorBillingHasSubscriptionForInvoice(subscription, false)).toBe(true);
  });

  it("keeps usage trial state when no subscription is active", () => {
    expect(
      resolveOperatorBillingIsTrialUsage({ isTrial: true }, { hasSubscription: false, isPaymentPastDue: false }),
    ).toBe(true);
  });
});
