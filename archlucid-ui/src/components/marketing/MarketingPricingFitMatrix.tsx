import { cn } from "@/lib/utils";

import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { MARKETING_PRICING_FIT_RECOMMENDATIONS } from "@/lib/marketing/marketing-pricing-tier-display";

/** Persona-to-plan guidance under the tier grid — explicit recommendations over checkmarks alone. */
export function MarketingPricingFitMatrix(): React.JSX.Element {
  return (
    <div
      className="mt-12 overflow-x-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      data-testid="pricing-fit-matrix"
    >
      <table className="min-w-full border-collapse">
        <caption className={cn("px-4 py-4 text-left font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.sectionTitle)}>
          Which plan fits your team?
        </caption>
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/60">
            <th scope="col" className={cn("px-4 py-2 text-left font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
              Team type
            </th>
            <th scope="col" className={cn("px-4 py-2 text-left font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
              Recommended plan
            </th>
          </tr>
        </thead>
        <tbody>
          {MARKETING_PRICING_FIT_RECOMMENDATIONS.map((row) => (
            <tr
              key={row.teamType}
              className="border-t border-neutral-200 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/60"
            >
              <th scope="row" className={cn("px-4 py-3 text-left font-medium text-al-text-primary", MARKETING_TYPOGRAPHY.body)}>
                {row.teamType}
              </th>
              <td className={cn("px-4 py-3 font-semibold text-teal-800 dark:text-teal-200", MARKETING_TYPOGRAPHY.body)}>
                {row.recommendedPlan}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
