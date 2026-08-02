import { CtaButton } from "@/components/marketing/CtaButton";
import { SelfDemoRequestCta } from "@/components/marketing/SelfDemoRequestCta";
import { WelcomeMarketingHeroVisual } from "@/components/marketing/WelcomeMarketingHeroVisual";
import {
  WELCOME_HERO_DIFFERENTIATORS,
  WELCOME_HERO_PITCH,
  WELCOME_PROOF_LADDER_PRIMARY_HREF,
  WELCOME_SEE_IT_CTA_LABEL,
} from "@/components/marketing/welcome-marketing-copy";
import { BRAND_CATEGORY } from "@/lib/brand-category";
import {
  MARKETING_HERO_SECONDARY_CTA_CLASS,
  MARKETING_LAYOUT,
  MARKETING_MOTION,
  MARKETING_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Full-bleed welcome hero — brand, pitch, CTAs, and a framed product visual. */
export function WelcomeMarketingHeroSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="hero-heading"
      className={cn(MARKETING_LAYOUT.heroBand, MARKETING_MOTION.revealIn)}
      data-testid="welcome-hero-band"
    >
      <div className={MARKETING_LAYOUT.heroBandInner}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-12">
          <div className="text-center lg:text-left">
            <p className={MARKETING_TYPOGRAPHY.eyebrow} data-testid="welcome-brand-category-eyebrow">
              {BRAND_CATEGORY}
            </p>
            <h1 id="hero-heading" className={cn("mt-3", MARKETING_TYPOGRAPHY.heroTitle)}>
              Defensible architecture, on demand.
            </h1>
            <p
              className={cn("mx-auto mt-4 max-w-2xl lg:mx-0", MARKETING_TYPOGRAPHY.lead)}
              data-testid="welcome-hero-pitch"
            >
              {WELCOME_HERO_PITCH}
            </p>
            <ul
              className={cn(
                "mx-auto mt-5 grid max-w-2xl list-disc gap-x-8 gap-y-1 ps-5 text-start text-al-text-secondary marker:text-teal-700 sm:grid-cols-2 lg:mx-0 dark:marker:text-teal-300",
                MARKETING_TYPOGRAPHY.meta,
              )}
              data-testid="welcome-hero-differentiators"
            >
              {WELCOME_HERO_DIFFERENTIATORS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div
              data-testid="welcome-hero-cta-stack"
              className="mt-8 flex w-full flex-col items-center gap-4 lg:items-start"
            >
              <div
                className="flex w-full max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center lg:justify-start"
                data-testid="welcome-hero-primary-secondary-row"
              >
                <SelfDemoRequestCta />
                <CtaButton
                  href={WELCOME_PROOF_LADDER_PRIMARY_HREF}
                  variant="outline"
                  size="lg"
                  className={MARKETING_HERO_SECONDARY_CTA_CLASS}
                  data-testid="welcome-hero-see-it-cta"
                >
                  {WELCOME_SEE_IT_CTA_LABEL}
                </CtaButton>
              </div>
            </div>
          </div>
          <WelcomeMarketingHeroVisual />
        </div>
      </div>
    </section>
  );
}
