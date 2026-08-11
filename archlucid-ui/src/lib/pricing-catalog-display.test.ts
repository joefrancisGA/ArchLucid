import { describe, expect, it } from "vitest";

import {
  buildOperatorBillingAddonLines,
  buildOperatorBillingPlanSummaryLines,
  formatIncludedArchitecturePackagesPerMonth,
  formatIncludedUsersAndWorkspaces,
  formatPlanPrice,
  formatPricingCatalogEffectiveDate,
} from "@/lib/pricing-catalog-display";
import {
  BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL,
  BILLING_CUSTOM_AI_ALLOWANCE_VALUE,
  BILLING_INCLUDED_AI_CREDITS_LABEL,
  BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL,
} from "@/lib/vocabulary/billing-meter-vocabulary";
import type { PricingDoc } from "@/lib/pricing-types";
import pricingJson from "../../public/pricing.json";

const pricing: PricingDoc = {
  schemaVersion: 1,
  effectiveDate: "2026-07-09",
  currency: "USD",
  packages: [],
};

describe("pricing-catalog-display", () => {
  it("formats bundled monthly plan price for billing and marketing", () => {
    expect(
      formatPlanPrice(
        {
          id: "team",
          title: "Team",
          summary: "Team",
          planMonthlyUsd: 249,
          pricingDisplay: "monthly",
        },
        "USD",
      ),
    ).toBe("$249 / mo");
  });

  it("shows custom enterprise pricing without annual floor copy", () => {
    const lines = buildOperatorBillingPlanSummaryLines(pricing, {
      id: "enterprise",
      title: "Enterprise",
      summary: "Custom contract",
      pricingDisplay: "custom",
      includedUsers: 0,
      includedWorkspaces: 0,
      annualCeilingUsd: 250000,
    });

    expect(lines).toEqual([
      { label: "Plan price", value: "Custom" },
      { label: BILLING_INCLUDED_AI_CREDITS_LABEL, value: BILLING_CUSTOM_AI_ALLOWANCE_VALUE },
    ]);
    expect(lines.some((line) => line.value.includes("0 users"))).toBe(false);
    expect(lines.some((line) => line.value.includes("60,000"))).toBe(false);
  });

  it("omits zero-quantity included users and workspaces (TB-1167)", () => {
    expect(
      formatIncludedUsersAndWorkspaces({
        id: "enterprise",
        title: "Enterprise",
        summary: "Custom contract",
        pricingDisplay: "custom",
        includedUsers: 0,
        includedWorkspaces: 0,
      }),
    ).toBeNull();

    const enterpriseFromCatalog = pricingJson.packages.find((pkg) => pkg.id === "enterprise");

    if (enterpriseFromCatalog === undefined) {
      throw new Error("Expected enterprise package in pricing.json.");
    }

    expect(formatIncludedUsersAndWorkspaces(enterpriseFromCatalog)).toBeNull();
    expect(
      buildOperatorBillingPlanSummaryLines(pricing, enterpriseFromCatalog).some((line) =>
        line.value.includes("0 users"),
      ),
    ).toBe(false);
  });

  it("builds plan summary from catalog fields instead of workspace SKUs", () => {
    const lines = buildOperatorBillingPlanSummaryLines(pricing, {
      id: "architect",
      title: "Architect",
      summary: "Solo architect",
      planMonthlyUsd: 99,
      pricingDisplay: "monthly",
      includedUsers: 1,
      includedWorkspaces: 1,
      monthlyAiCredits: 500,
      includedReviewsPerMonth: 5,
      workspaceMonthlyUsd: 199,
      seatMonthlyUsd: 79,
    });

    expect(lines.map((line) => line.label)).toEqual([
      "Plan price",
      "Included",
      BILLING_INCLUDED_AI_CREDITS_LABEL,
      BILLING_INCLUDED_ARCHITECTURE_PACKAGES_LABEL,
    ]);
    expect(lines[0]?.value).toBe("$99 / mo");
    expect(lines.some((line) => line.label === "Workspace platform")).toBe(false);
  });

  it("keeps add-on charges in a separate collapsed-friendly list", () => {
    const addonLines = buildOperatorBillingAddonLines(pricing, {
      id: "team",
      title: "Team",
      summary: "Team",
      overageReviewUsd: 10,
      seatMonthlyUsd: 79,
      maxArchitectSeats: 10,
      workspaceMonthlyUsd: 199,
    });

    expect(addonLines.map((line) => line.label)).toEqual([
      BILLING_ADDITIONAL_ARCHITECTURE_PACKAGES_LABEL,
      "Additional users",
      "Additional workspaces",
    ]);
    expect(addonLines.find((line) => line.label === "Additional users")?.value).toBe(
      "$79 / user / mo (plan max 10 seats)",
    );
    expect(addonLines.find((line) => line.label === "Additional workspaces")?.value).toBe(
      "$199 / workspace / mo",
    );
  });

  it("formats included architecture packages for public pricing cards", () => {
    expect(
      formatIncludedArchitecturePackagesPerMonth({
        id: "team",
        title: "Team",
        summary: "Team",
        includedReviewsPerMonth: 20,
      }),
    ).toBe("20 architecture reviews / month");
  });

  it("formats catalog effective date for billing tier footers (TB-1170)", () => {
    expect(formatPricingCatalogEffectiveDate("2026-07-09")).toBe("Jul 9, 2026");
  });
});
