import { cn } from "@/lib/utils";

import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { MARKETING_PRICING_USAGE_FAQ_ITEMS, MARKETING_PRICING_USAGE_FAQ_TITLE } from "@/lib/marketing/marketing-public-pricing";

/** Secondary FAQ for AI credits, add-on seats/workspaces, and overage behavior. */
export function MarketingPricingUsageFaqSection(): React.JSX.Element {
  return (
    <section
      className="mb-12 mt-12 rounded-xl border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-800 dark:bg-neutral-900/40"
      aria-labelledby="pricing-usage-faq-heading"
      data-testid="pricing-usage-faq-section"
    >
      <h2 id="pricing-usage-faq-heading" className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.sectionTitle)}>
        {MARKETING_PRICING_USAGE_FAQ_TITLE}
      </h2>
      <div className="mt-4 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-950/40">
        {MARKETING_PRICING_USAGE_FAQ_ITEMS.map((item, index) => (
          <details key={item.question} className="group px-4 py-3" open={index === 0}>
            <summary
              className={cn(
                "cursor-pointer select-none font-medium text-al-text-primary marker:content-none [&::-webkit-details-marker]:hidden",
                MARKETING_TYPOGRAPHY.cardTitle,
              )}
            >
              <span className="inline-flex items-center gap-2">
                <span aria-hidden className="text-teal-800 transition-transform group-open:rotate-90 dark:text-teal-300">
                  ▸
                </span>
                {item.question}
              </span>
            </summary>
            <p className={cn("m-0 mt-2 ps-5 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
