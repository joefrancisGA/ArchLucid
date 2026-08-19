/** Shape of `public/pricing.json` (generated from `PRICING_PHILOSOPHY.md`). */
export type PricingPackage = {
  id: string;
  title: string;
  summary: string;
  /** Single buyer-facing monthly price when the plan is self-serve bundled. */
  planMonthlyUsd?: number;
  /** When `"custom"`, public surfaces show Custom instead of a list price. */
  pricingDisplay?: "monthly" | "custom";
  /**
   * Buyer-facing included seat/user count (wins for display).
   * When `includedArchitectSeats` is also set, CI/coherence requires the two values to match.
   */
  includedUsers?: number;
  includedWorkspaces?: number;
  monthlyAiCredits?: number;
  workspaceMonthlyUsd?: number;
  maxWorkspaces?: number;
  /** Alias of included seats for architect-seat SKUs — must match `includedUsers` when both are present. */
  includedArchitectSeats?: number;
  /** Hard seat ceiling for the plan (included + add-on); beyond this the tenant must upgrade tiers. */
  maxArchitectSeats?: number;
  seatMonthlyUsd?: number;
  includedReviewsPerMonth?: number;
  overageReviewUsd?: number;
  annualFloorUsd?: number;
  annualCeilingUsd?: number;
};

export type PricingDoc = {
  schemaVersion: number;
  effectiveDate: string;
  currency: string;
  /**
   * When **`NEXT_PUBLIC_STRIPE_TEAM_CHECKOUT_ENABLED`** is opt-in true and this URL passes `isUsableTeamStripeCheckoutUrl`
   * (`team-stripe-checkout-url.ts`), the Team tier card uses Stripe Checkout as its primary CTA. Placeholders stay hidden.
   */
  teamStripeCheckoutUrl?: string | null;
  /** Must be true when `teamStripeCheckoutUrl` contains CI placeholder markers — see `scripts/ci/pricing_json_checkout_guard.py`. */
  teamStripeCheckoutUrlSalesLedPlaceholder?: boolean;
  /**
   * Optional Stripe Checkout URL for the Architect self-serve tier (same placeholder discipline as Team).
   */
  architectStripeCheckoutUrl?: string | null;
  architectStripeCheckoutUrlSalesLedPlaceholder?: boolean;
  architectStripeCheckoutUrlStripeTestMode?: boolean;
  /**
   * When true, marks a Stripe **test-mode** hosted Checkout / Payment Link (`cs_test_*`, `buy.stripe.com/test_*`)
   * or other explicitly non-production checkout URL. CI enforces this for hosted Stripe test patterns; omit or
   * false for production buyer-facing checkout.
   */
  teamStripeCheckoutUrlStripeTestMode?: boolean;
  packages: PricingPackage[];
};
