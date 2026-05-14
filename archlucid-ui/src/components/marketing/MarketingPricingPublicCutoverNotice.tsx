/** Static notice: public price list timing vs Marketplace go-live. */
export function MarketingPricingPublicCutoverNotice() {
  return (
    <aside
      aria-label="Public price list and Marketplace go-live timing"
      className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300"
    >
      When ArchLucid lists on Azure Marketplace (targeting Q2 2026), published list prices become our canonical public
      packaging until superseded by contract amendments. Published list tiers are illustrative — final pricing depends on
      deployment scope, volume, and procurement channel; confirm totals with your account team before budgeting. Self-service
      Stripe checkout is opt-in where enabled; regulated buyers predominantly start with quote review.
    </aside>
  );
}
