import Link from "next/link";

import { CtaButton } from "@/components/marketing/CtaButton";
import { Button } from "@/components/ui/button";
import { BRAND_CATEGORY } from "@/lib/brand-category";
import { MARKETING_LAYOUT, MARKETING_MOTION, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  WHY_HERO_PITCH,
  WHY_HERO_PRIMARY_CTA_HREF,
  WHY_HERO_PRIMARY_CTA_LABEL,
  WHY_HERO_SECONDARY_CTA_HREF,
  WHY_HERO_SECONDARY_CTA_LABEL,
} from "@/lib/why-page-copy";
import { cn } from "@/lib/utils";

/** TB-1301: first-viewport hero — brand signal, headline, one pitch line, and conversion CTAs. */
export function WhyMarketingHeroSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="why-hero-heading"
      className={cn(MARKETING_LAYOUT.heroBand, MARKETING_MOTION.revealIn)}
      data-testid="why-hero-band"
    >
      <div className={MARKETING_LAYOUT.heroBandInner}>
        <p className={MARKETING_TYPOGRAPHY.eyebrow} data-testid="why-brand-category-eyebrow">
          {BRAND_CATEGORY}
        </p>
        <h1 id="why-hero-heading" className={cn("mt-3", MARKETING_TYPOGRAPHY.heroTitle)}>
          Why ArchLucid
        </h1>
        <p
          className={cn("mt-4 max-w-3xl", MARKETING_TYPOGRAPHY.lead)}
          data-testid="why-hero-pitch"
        >
          {WHY_HERO_PITCH}
        </p>
        <div
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
          data-testid="why-hero-cta-row"
        >
          <CtaButton
            href={WHY_HERO_PRIMARY_CTA_HREF}
            variant="primary"
            size="lg"
            data-testid="why-hero-primary-cta"
          >
            {WHY_HERO_PRIMARY_CTA_LABEL}
          </CtaButton>
          <Button asChild variant="outline" size="lg" data-testid="why-hero-secondary-cta">
            <Link href={WHY_HERO_SECONDARY_CTA_HREF}>{WHY_HERO_SECONDARY_CTA_LABEL}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
