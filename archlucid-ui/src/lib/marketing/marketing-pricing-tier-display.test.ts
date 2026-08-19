import { describe, expect, it } from "vitest";

import {
  MARKETING_PRICING_FIT_MATRIX,
  MARKETING_PRICING_FIT_RECOMMENDATIONS,
  MARKETING_PRICING_TIER_BEST_FOR,
  buildMarketingPricingIncludedLines,
  resolveMarketingTierFitQualifier,
  resolveMarketingTierPrimaryCtaVariant,
} from "@/lib/marketing/marketing-pricing-tier-display";
import type { PricingPackage } from "@/lib/pricing-types";

const architectPackage: PricingPackage = {
  id: "architect",
  title: "Architect",
  summary: "For one architect",
  planMonthlyUsd: 99,
  pricingDisplay: "monthly",
  includedUsers: 1,
  includedWorkspaces: 1,
  monthlyAiCredits: 500,
  includedReviewsPerMonth: 10,
};

describe("marketing-pricing-tier-display", () => {
  it("defines best-for copy for every public tier", () => {
    expect(MARKETING_PRICING_TIER_BEST_FOR.architect).toMatch(/solo architect/i);
    expect(MARKETING_PRICING_TIER_BEST_FOR.professional).toMatch(/governance/i);
  });

  it("builds included lines from catalog capacity fields", () => {
    expect(buildMarketingPricingIncludedLines(architectPackage)).toEqual([
      "1 user · 1 workspace",
      "10 architecture reviews / month",
      "500 AI credits / month",
    ]);
  });

  it("marks one primary fit per persona row", () => {
    const soloRow = MARKETING_PRICING_FIT_MATRIX.find((row) => row.label === "Solo architect");

    expect(soloRow?.tiers.architect).toBe(true);
    expect(soloRow?.tiers.team).toBe(false);
  });

  it("uses outline CTAs for architect, team, and enterprise", () => {
    expect(resolveMarketingTierPrimaryCtaVariant("architect", false)).toBe("outline");
    expect(resolveMarketingTierPrimaryCtaVariant("team", false)).toBe("outline");
    expect(resolveMarketingTierPrimaryCtaVariant("enterprise", false)).toBe("outline");
    expect(resolveMarketingTierPrimaryCtaVariant("professional", true)).toBe("primary");
  });

  it("exposes a fit qualifier for the recommended professional tier", () => {
    expect(resolveMarketingTierFitQualifier("professional")).toBe("Governance program");
    expect(resolveMarketingTierFitQualifier("team")).toBeNull();
  });

  it("maps each persona to an explicit recommended plan", () => {
    expect(MARKETING_PRICING_FIT_RECOMMENDATIONS).toHaveLength(3);
    expect(MARKETING_PRICING_FIT_RECOMMENDATIONS[0]?.recommendedPlan).toBe("Architect");
  });
});
