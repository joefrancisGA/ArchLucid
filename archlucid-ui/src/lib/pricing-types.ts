/** Shape of `public/pricing.json` (generated from `PRICING_PHILOSOPHY.md`). */
export type PricingPackage = {
  id: string;
  title: string;
  summary: string;
  workspaceMonthlyUsd?: number;
  maxWorkspaces?: number;
  includedArchitectSeats?: number;
  seatMonthlyUsd?: number;
  includedRunsPerMonth?: number;
  overageRunUsd?: number;
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
   * When true, marks a Stripe **test-mode** hosted Checkout / Payment Link (`cs_test_*`, `buy.stripe.com/test_*`)
   * or other explicitly non-production checkout URL. CI enforces this for hosted Stripe test patterns; omit or
   * false for production buyer-facing checkout.
   */
  teamStripeCheckoutUrlStripeTestMode?: boolean;
  packages: PricingPackage[];
};
