import { describe, expect, it } from "vitest";

import { buildOperatorBillingPricingLines } from "./operator-billing-pricing-lines";
import type { PricingDoc } from "@/lib/pricing-types";

const pricing: PricingDoc = {
  schemaVersion: 1,
  effectiveDate: "2026-04-17",
  currency: "USD",
  packages: [],
};

describe("buildOperatorBillingPricingLines", () => {
  it("orders included limits before additional charges", () => {
    const lines = buildOperatorBillingPricingLines(pricing, {
      id: "team",
      title: "Team",
      summary: "Small team",
      workspaceMonthlyUsd: 199,
      includedArchitectSeats: 5,
      seatMonthlyUsd: 79,
      includedReviewsPerMonth: 20,
      overageReviewUsd: 10,
    });

    expect(lines.map((line) => line.label)).toEqual([
      "Workspace platform",
      "Included architect seats",
      "Included reviews",
      "Additional reviews",
      "Additional architect seats",
    ]);
  });

  it("uses buyer-safe enterprise annual copy without land range", () => {
    const lines = buildOperatorBillingPricingLines(pricing, {
      id: "enterprise",
      title: "Enterprise",
      summary: "Annual contract",
      annualFloorUsd: 60000,
      annualCeilingUsd: 250000,
    });

    expect(lines).toEqual([
      {
        label: "Annual contract",
        value: "Starting at $60,000 / year",
      },
    ]);
  });
});
