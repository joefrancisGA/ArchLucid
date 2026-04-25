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
   * When set (non-empty), the Team tier card shows “Subscribe with Stripe” linking here.
   * The repo may ship with `https://checkout.stripe.com/placeholder-replace-before-launch` from
   * `PRICING_PHILOSOPHY.md` locked-prices — replace with a real Stripe URL before launch, or omit to hide the button.
   */
  teamStripeCheckoutUrl?: string | null;
  packages: PricingPackage[];
};
