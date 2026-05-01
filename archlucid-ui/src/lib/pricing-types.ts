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
   * When set to a **usable** URL (see `isUsableTeamStripeCheckoutUrl` in `team-stripe-checkout-url.ts`), the Team tier
   * card shows “Subscribe with Stripe”. Placeholder URLs from `PRICING_PHILOSOPHY.md` must not render the button.
   */
  teamStripeCheckoutUrl?: string | null;
  packages: PricingPackage[];
};
