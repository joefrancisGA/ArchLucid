import { describe, expect, it } from "vitest";

import {
  buildMarketingSelfServeBillingHref,
  buildOperatorBillingPlanPath,
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
});
