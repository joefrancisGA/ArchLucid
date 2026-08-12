import { describe, expect, it } from "vitest";

import {
  buildMarketingSelfServeBillingHref,
  buildOperatorBillingPlanPath,
  buildOperatorBillingSalesLedQuoteHref,
} from "@/lib/marketing/marketing-billing-plan-href";

describe("marketing-billing-plan-href", () => {
  it("builds operator billing path with plan query", () => {
    expect(buildOperatorBillingPlanPath("team")).toBe("/administration/billing?plan=team");
  });

  it("routes marketing self-serve through sign-in with billing returnUrl", () => {
    expect(buildMarketingSelfServeBillingHref("architect")).toBe(
      "/auth/signin?returnUrl=%2Fadministration%2Fbilling%3Fplan%3Darchitect",
    );
  });

  it("routes operator sales-led tiers to the public quote form (TB-1169)", () => {
    expect(buildOperatorBillingSalesLedQuoteHref("professional")).toBe(
      "/pricing?source=operator-billing&plan=professional#pricing-quote-request",
    );
    expect(buildOperatorBillingSalesLedQuoteHref("enterprise")).toBe(
      "/pricing?source=operator-billing&plan=enterprise#pricing-quote-request",
    );
  });
});
