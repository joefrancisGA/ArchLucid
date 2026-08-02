import { cn } from "@/lib/utils";

import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { MARKETING_PRICING_UNIVERSAL_INCLUDES } from "@/lib/marketing/marketing-pricing-tier-display";

/** Reassures buyers that lower tiers still include core ArchLucid value. */
export function MarketingPricingUniversalIncludesStrip(): React.JSX.Element {
  return (
    <div
      className="mb-8 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="pricing-universal-includes-strip"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>Included in every plan</p>
      <ul className={cn("m-0 mt-3 flex flex-wrap gap-x-6 gap-y-2 p-0", MARKETING_TYPOGRAPHY.body)}>
        {MARKETING_PRICING_UNIVERSAL_INCLUDES.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span aria-hidden className="text-teal-700 dark:text-teal-300">
              ✓
            </span>
            <span className="text-al-text-secondary">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
