/** Single procurement caveat under tier cards — avoids repeating provisional pricing language elsewhere on the page. */
export function MarketingPricingPublicCutoverNotice() {
  return (
    <aside
      aria-label="Enterprise pricing and quotation guidance"
      data-testid="pricing-single-footnote"
      className="mb-6 max-w-3xl rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs leading-relaxed text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300"
    >
      Final pricing depends on deployment scope, review volume, data sensitivity, deployment model, and procurement channel.
    </aside>
  );
}
