import Link from "next/link";

import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  PRICING_PAGE_FAQ_LINK_LABEL,
  PRICING_PAGE_FAQ_LINK_PREFIX,
  PRICING_PAGE_INTRO,
  PRICING_PAGE_TITLE,
} from "@/lib/marketing/pricing-page-copy";
import { cn } from "@/lib/utils";

/** `/pricing` page hero — h1, lead, and FAQ link in the first viewport. */
export function PricingPageHero(): React.JSX.Element {
  return (
    <header className="mb-10" data-testid="pricing-page-hero">
      <h1
        id="pricing-page-heading"
        className={cn("m-0 text-3xl font-semibold leading-9 tracking-tight text-al-text-primary sm:text-4xl")}
        data-testid="pricing-page-title"
      >
        {PRICING_PAGE_TITLE}
      </h1>
      <p className={cn("m-0 mt-4 max-w-3xl", MARKETING_TYPOGRAPHY.lead)}>{PRICING_PAGE_INTRO}</p>
      <p className={cn("m-0 mt-4 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)} data-testid="pricing-faq-link-line">
        {PRICING_PAGE_FAQ_LINK_PREFIX}{" "}
        <Link className={MARKETING_SURFACES.inlineLink} href="/faq">
          {PRICING_PAGE_FAQ_LINK_LABEL}
        </Link>
        .
      </p>
    </header>
  );
}
