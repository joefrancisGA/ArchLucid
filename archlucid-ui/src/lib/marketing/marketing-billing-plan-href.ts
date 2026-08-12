import type { MarketingPricingTierId } from "@/lib/marketing/marketing-public-pricing";

/** Operator billing route with optional pre-selected catalog plan. */
export function buildOperatorBillingPlanPath(planId: MarketingPricingTierId): string {
  return `/administration/billing?plan=${encodeURIComponent(planId)}`;
}

/**
 * Marketing-site deep link: sign in (or complete signup) then land on in-app billing with the plan pre-selected.
 * Marketing never calls Stripe directly — checkout is tenant-bound inside the operator app (TB-763).
 */
export function buildMarketingSelfServeBillingHref(planId: MarketingPricingTierId): string {
  const returnUrl = buildOperatorBillingPlanPath(planId);

  return `/auth/signin?returnUrl=${encodeURIComponent(returnUrl)}`;
}

/** Public pricing quote panel deep link for sales-led tiers (TB-1169). */
export function buildOperatorBillingSalesLedQuoteHref(planId: MarketingPricingTierId): string {
  const params = new URLSearchParams({
    source: "operator-billing",
    plan: planId,
  });

  return `/pricing?${params.toString()}#pricing-quote-request`;
}
