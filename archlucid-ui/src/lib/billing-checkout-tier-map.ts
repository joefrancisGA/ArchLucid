import type { MarketingPricingTierId } from "@/lib/marketing/marketing-public-pricing";

export type BillingCheckoutTargetTier = "Team" | "Architect" | "Pro" | "Enterprise";

/** Maps public pricing catalog ids to API `TargetTier` values. */
export function resolveBillingCheckoutTargetTier(planId: MarketingPricingTierId): BillingCheckoutTargetTier {
  switch (planId) {
    case "architect":
      return "Architect";
    case "team":
      return "Team";
    case "professional":
      return "Pro";
    case "enterprise":
      return "Enterprise";
    default: {
      const exhaustive: never = planId;
      return exhaustive;
    }
  }
}

/** Self-serve checkout is limited to catalog tiers with immediate Stripe SKUs (not guided-trial or enterprise sales). */
export function isSelfServeBillingCheckoutPlan(planId: MarketingPricingTierId): boolean {
  return planId === "architect" || planId === "team";
}
