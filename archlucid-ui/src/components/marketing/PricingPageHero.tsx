import Link from "next/link";

import { WelcomeMarketingHeroVisual } from "@/components/marketing/WelcomeMarketingHeroVisual";
import { MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PRICING_PAGE_FAQ_LINK_LABEL,
  PRICING_PAGE_FAQ_LINK_PREFIX,
  PRICING_PAGE_INTRO,
  PRICING_PAGE_TITLE,
} from "@/lib/marketing/pricing-page-copy";
import { cn } from "@/lib/utils";

/** `/pricing` page hero — h1, lead, FAQ link, and above-fold proof deep-linking to `/see-it`. */
export function PricingPageHero(): React.JSX.Element {
  return (
    <section
      className={cn(
        "mb-10 grid items-start gap-10 border-b border-neutral-200 pb-8 dark:border-neutral-800 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12",
        MARKETING_MOTION.revealIn,
      )}
      data-testid="pricing-page-hero"
      aria-labelledby="pricing-page-heading"
    >
      <header>
        <h1
          id="pricing-page-heading"
          className={cn("m-0", MARKETING_TYPOGRAPHY.heroTitle)}
          data-testid="pricing-page-title"
        >
          {PRICING_PAGE_TITLE}
        </h1>
        <p className={cn("m-0 mt-4 max-w-3xl", MARKETING_TYPOGRAPHY.lead)}>{PRICING_PAGE_INTRO}</p>
        <p
          className={cn("m-0 mt-4 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}
          data-testid="pricing-faq-link-line"
        >
          {PRICING_PAGE_FAQ_LINK_PREFIX}{" "}
          <Link className={MARKETING_SURFACES.inlineLink} href="/faq">
            {PRICING_PAGE_FAQ_LINK_LABEL}
          </Link>
          .
        </p>
      </header>

      <WelcomeMarketingHeroVisual />
    </section>
  );
}
