import Link from "next/link";

import { Button } from "@/components/ui/button";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  MARKETING_FAQ_BACK_TO_OVERVIEW_LABEL,
  MARKETING_FAQ_PAGE_INTRO,
  MARKETING_FAQ_PAGE_TITLE,
  MARKETING_FAQ_REQUEST_GUIDED_TRIAL_CTA,
  MARKETING_FAQ_START_EVALUATION_CTA,
  MARKETING_FAQ_VIEW_PRICING_LABEL,
} from "@/lib/marketing/marketing-faq-page-copy";
import { cn } from "@/lib/utils";

export type MarketingFaqCtaRowProps = {
  readonly testId: string;
};

export function MarketingFaqCtaRow(props: MarketingFaqCtaRowProps): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-2" data-testid={props.testId}>
      <Button asChild size="sm" variant="primary">
        <Link href="/signup">{MARKETING_FAQ_START_EVALUATION_CTA}</Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href="/pricing#pricing-quote-request">{MARKETING_FAQ_REQUEST_GUIDED_TRIAL_CTA}</Link>
      </Button>
    </div>
  );
}

export type MarketingFaqPageHeroProps = {
  readonly ctaTestId?: string;
};

/** `/faq` page hero — h1, lead, overview/pricing links, and primary CTAs in the first viewport. */
export function MarketingFaqPageHero(props: MarketingFaqPageHeroProps): React.JSX.Element {
  const ctaTestId = props.ctaTestId ?? "marketing-faq-cta-top";

  return (
    <header
      className="border-b border-neutral-200 pb-6 dark:border-neutral-800"
      data-testid="marketing-faq-page-hero"
    >
      <h1
        id="marketing-faq-page-heading"
        className={MARKETING_TYPOGRAPHY.pageTitle}
        data-testid="marketing-faq-page-title"
      >
        {MARKETING_FAQ_PAGE_TITLE}
      </h1>
      <p className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{MARKETING_FAQ_PAGE_INTRO}</p>
      <p className={cn("mt-3", MARKETING_TYPOGRAPHY.meta)} data-testid="marketing-faq-hero-links">
        <Link className={MARKETING_SURFACES.inlineLink} href="/welcome">
          {MARKETING_FAQ_BACK_TO_OVERVIEW_LABEL}
        </Link>
        <span aria-hidden="true"> · </span>
        <Link className={MARKETING_SURFACES.inlineLink} href="/pricing">
          {MARKETING_FAQ_VIEW_PRICING_LABEL}
        </Link>
      </p>
      <div className="mt-5">
        <MarketingFaqCtaRow testId={ctaTestId} />
      </div>
    </header>
  );
}
