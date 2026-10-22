import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  BUYER_EARLY_ADOPTER_PRICING_BANNER_SUMMARY,
  BUYER_EARLY_ADOPTER_PRICING_NOTE,
} from "@/lib/buyer/buyer-polish-copy";
import { BUYER_MARKETING_PRICING_AI_USAGE_NOTE } from "@/lib/marketing/marketing-public-pricing";

export type MarketingPricingEarlyAdopterBannerProps = {
  readonly showAiUsageNote?: boolean;
};

/** Compact early-adopter notice with optional expanded commercial detail. */
export function MarketingPricingEarlyAdopterBanner(props: MarketingPricingEarlyAdopterBannerProps): React.JSX.Element {
  return (
    <div
      className="mt-10 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900/50"
      data-testid="pricing-early-adopter-framing"
    >
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        <span className="font-semibold text-al-text-primary">Early adopter pricing:</span> {BUYER_EARLY_ADOPTER_PRICING_BANNER_SUMMARY}
      </p>
      <details className="mt-2">
        <summary className={cn("cursor-pointer select-none font-medium text-al-text-secondary dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          View full early-adopter terms
        </summary>
        <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>{BUYER_EARLY_ADOPTER_PRICING_NOTE}</p>
      </details>
      {props.showAiUsageNote === true ? (
        <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)} data-testid="pricing-ai-usage-note">
          {BUYER_MARKETING_PRICING_AI_USAGE_NOTE}
        </p>
      ) : null}
    </div>
  );
}
