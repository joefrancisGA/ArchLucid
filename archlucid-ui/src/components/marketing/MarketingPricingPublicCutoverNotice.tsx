/** Procurement-safe notice on public pricing — avoids deferred checkout/Marketplace timing in buyer-facing copy. */
export function MarketingPricingPublicCutoverNotice() {
  return (
    <aside
      aria-label="Enterprise pricing and quotation guidance"
      className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300"
    >
      Enterprise pricing depends on deployment scope, volume, procurement channel, and contractual terms.
      Published list tiers are illustrative; regulated-industry buyers typically begin with a quote review—confirm totals
      with your account team before budgeting.
    </aside>
  );
}
