import { cn } from "@/lib/utils";

import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { MARKETING_PRICING_USAGE_FAQ_ITEMS, MARKETING_PRICING_USAGE_FAQ_TITLE } from "@/lib/marketing/marketing-public-pricing";

/** Secondary FAQ for AI credits, add-on seats/workspaces, and overage behavior. */
export function MarketingPricingUsageFaqSection(): React.JSX.Element {
  return (
    <section
      className="mb-10 rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/40"
      aria-labelledby="pricing-usage-faq-heading"
      data-testid="pricing-usage-faq-section"
    >
      <h2 id="pricing-usage-faq-heading" className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.sectionTitle)}>
        {MARKETING_PRICING_USAGE_FAQ_TITLE}
      </h2>
      <dl className="mt-4 space-y-4">
        {MARKETING_PRICING_USAGE_FAQ_ITEMS.map((item) => (
          <div key={item.question}>
            <dt className={cn("font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>{item.question}</dt>
            <dd className={cn("m-0 mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
