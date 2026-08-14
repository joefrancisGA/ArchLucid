import type { MarketingPricingTierId } from "@/lib/marketing/marketing-public-pricing";
import type { PricingPackage } from "@/lib/pricing-types";
import {
  formatIncludedArchitecturePackagesPerMonth,
  formatIncludedUsersAndWorkspaces,
  formatMonthlyAiCredits,
} from "@/lib/pricing-catalog-display";

/** Buyer-facing persona line — helps scan which plan fits before reading feature bullets. */
export const MARKETING_PRICING_TIER_BEST_FOR: Readonly<Record<MarketingPricingTierId, string>> = {
  architect: "Solo architects proving value on one workspace",
  team: "Small teams coordinating architecture reviews",
  professional: "Growing governance teams standardizing review practice",
  enterprise: "Enterprise procurement, SSO, and private deployment",
};

/** Qualitative differentiators — capacity lines come from the pricing catalog. */
export const MARKETING_PRICING_TIER_HIGHLIGHTS: Readonly<Record<MarketingPricingTierId, readonly string[]>> = {
  architect: [
    "Architecture creation and reviews",
    "Evidence graph, evidence Q&A, and review findings",
    "Basic exports and sample workspace",
  ],
  team: [
    "Basic governance for review findings",
    "Sealed review records and comparison reviews",
    "Self-service start — no procurement call required",
  ],
  professional: [
    "Policy packs, audit exports, and review comparison",
    "Scorecards and guided trial onboarding",
    "Expanded AI allowance with clear overage options",
  ],
  enterprise: [
    "SSO, procurement terms, and private deployment options",
    "Custom data handling and dedicated support",
    "Custom policy packs and enterprise workflow integrations",
  ],
};

export type MarketingPricingFitRow = {
  readonly label: string;
  readonly tiers: Readonly<Record<MarketingPricingTierId, boolean>>;
};

/** Core value buyers keep on every paid tier — shown above the plan grid. */
export const MARKETING_PRICING_UNIVERSAL_INCLUDES: readonly string[] = [
  "Evidence-backed architecture reviews",
  "AI-assisted analysis and evidence Q&A",
  "Exportable sealed review records",
  "Audit trail and evidence graph",
  "Policy packs",
];

export type MarketingPricingFitRecommendation = {
  readonly teamType: string;
  readonly recommendedPlan: string;
};

/** Explicit plan guidance — complements the tier grid without replacing it. */
export const MARKETING_PRICING_FIT_RECOMMENDATIONS: readonly MarketingPricingFitRecommendation[] = [
  { teamType: "Solo architect", recommendedPlan: "Architect" },
  { teamType: "Small review team", recommendedPlan: "Team" },
  { teamType: "Governance program", recommendedPlan: "Professional / Enterprise" },
];

/** Lightweight persona fit matrix — scan before comparing feature bullets. */
export const MARKETING_PRICING_FIT_MATRIX: readonly MarketingPricingFitRow[] = [
  {
    label: "Solo architect",
    tiers: { architect: true, team: false, professional: false, enterprise: false },
  },
  {
    label: "Small review team",
    tiers: { architect: false, team: true, professional: false, enterprise: false },
  },
  {
    label: "Governance program",
    tiers: { architect: false, team: false, professional: true, enterprise: true },
  },
];

export function buildMarketingPricingIncludedLines(pkg: PricingPackage): readonly string[] {
  const lines: string[] = [];
  const includedLine = formatIncludedUsersAndWorkspaces(pkg);

  if (includedLine !== null) {
    lines.push(includedLine);
  }

  const packagesLine = formatIncludedArchitecturePackagesPerMonth(pkg);

  if (packagesLine !== null) {
    lines.push(packagesLine);
  }

  const aiCreditsLine = formatMonthlyAiCredits(pkg);

  if (aiCreditsLine !== null) {
    lines.push(aiCreditsLine);
  }

  return lines;
}

export function resolveMarketingTierPrimaryCtaVariant(
  tierId: MarketingPricingTierId,
  isRecommended: boolean,
): "primary" | "outline" {
  if (tierId === "enterprise") {
    return "outline";
  }

  if (tierId === "architect") {
    return "outline";
  }

  if (isRecommended) {
    return "primary";
  }

  return "primary";
}

export function resolveMarketingTierPrimaryCtaSize(
  tierId: MarketingPricingTierId,
  isRecommended: boolean,
): "default" | "lg" {
  if (isRecommended && tierId === "professional") {
    return "lg";
  }

  return "default";
}
