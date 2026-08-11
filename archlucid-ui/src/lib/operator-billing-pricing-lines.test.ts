import { describe, expect, it } from "vitest";

import {
  BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL,
  BILLING_INCLUDED_AI_CREDITS_LABEL,
  BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL,
} from "./vocabulary/billing-meter-vocabulary";
import {
  buildOperatorBillingAddonLines,
  buildOperatorBillingPlanSummaryLines,
} from "./operator-billing-pricing-lines";
import type { PricingDoc } from "@/lib/pricing-types";

const pricing: PricingDoc = {
  schemaVersion: 1,
  effectiveDate: "2026-07-09",
  currency: "USD",
  packages: [],
};

describe("operator-billing-pricing-lines", () => {
  it("re-exports canonical plan summary lines", () => {
    const lines = buildOperatorBillingPlanSummaryLines(pricing, {
      id: "team",
      title: "Team",
      summary: "Small team",
      planMonthlyUsd: 249,
      pricingDisplay: "monthly",
      includedUsers: 5,
      includedWorkspaces: 1,
      monthlyAiCredits: 2500,
      includedReviewsPerMonth: 20,
      workspaceMonthlyUsd: 199,
      seatMonthlyUsd: 79,
      overageReviewUsd: 10,
    });

    expect(lines.map((line) => line.label)).toEqual([
      "Plan price",
      "Included",
      BILLING_INCLUDED_AI_CREDITS_LABEL,
      BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL,
    ]);
  });

  it("does not surface enterprise annual floor pricing", () => {
    const lines = buildOperatorBillingPlanSummaryLines(pricing, {
      id: "enterprise",
      title: "Enterprise",
      summary: "Annual contract",
      pricingDisplay: "custom",
      annualFloorUsd: 60000,
      annualCeilingUsd: 250000,
    });

    expect(lines.some((line) => line.value.includes("60,000"))).toBe(false);
    expect(lines[0]?.value).toBe("Custom");
  });

  it("exposes add-on lines separately from bundled plan summary", () => {
    const addonLines = buildOperatorBillingAddonLines(pricing, {
      id: "team",
      title: "Team",
      summary: "Team",
      seatMonthlyUsd: 79,
      overageReviewUsd: 10,
      workspaceMonthlyUsd: 199,
      maxArchitectSeats: 10,
    });

    expect(addonLines.map((line) => line.label)).toEqual([
      BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL,
      "Additional users",
      "Additional workspaces",
    ]);
  });
});
