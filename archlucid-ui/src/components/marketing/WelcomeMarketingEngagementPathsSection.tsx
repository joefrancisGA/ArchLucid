import Link from "next/link";
import { Suspense } from "react";

import { HeroEarlyAccessCta } from "@/components/marketing/HeroEarlyAccessCta";
import { WalkthroughRequestCta } from "@/components/marketing/WalkthroughRequestCta";
import {
  WELCOME_CONTOSO_ROI_PDF_HREF,
  WELCOME_CONTOSO_ROI_PDF_LABEL,
  WELCOME_ENGAGEMENT_PATHS_HEADING,
  WELCOME_HERO_CTA_SUBHEADING,
  WELCOME_HERO_EVALUATION_REASSURANCE,
  WELCOME_PROOF_LADDER_SAMPLE_HREF,
  WELCOME_PROOF_LADDER_SAMPLE_LABEL,
  WELCOME_PROOF_LADDER_SECONDARY_WALKTHROUGH_HREF,
  WELCOME_PROOF_LADDER_SECONDARY_WALKTHROUGH_LABEL,
  WELCOME_SEE_IT_CTA_LABEL,
  WELCOME_SEE_IT_HREF,
} from "@/components/marketing/welcome-marketing-copy";
import { MARKETING_LAYOUT, MARKETING_MOTION, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { appSiteHref } from "@/lib/site-urls";
import { cn } from "@/lib/utils";

/** Below-fold engagement + proof ladder — demoted from hero (TB-1294–TB-1296). */
export function WelcomeMarketingEngagementPathsSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="welcome-engagement-heading"
      className={cn(MARKETING_LAYOUT.sectionStack, MARKETING_MOTION.revealIn)}
      data-testid="welcome-engagement-paths"
    >
      <h2 id="welcome-engagement-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
        {WELCOME_ENGAGEMENT_PATHS_HEADING}
      </h2>
      <p
        className={cn("mt-3 max-w-3xl", MARKETING_TYPOGRAPHY.lead)}
        data-testid="welcome-engagement-subheading"
      >
        {WELCOME_HERO_CTA_SUBHEADING}
      </p>
      <p
        className={cn("mt-3 max-w-3xl text-neutral-700 dark:text-neutral-300", MARKETING_TYPOGRAPHY.body)}
        data-testid="welcome-engagement-reassurance"
      >
        {WELCOME_HERO_EVALUATION_REASSURANCE}
      </p>

      <Suspense
        fallback={
          <div
            className="mt-6 flex min-h-11 w-full max-w-2xl animate-pulse flex-col gap-3 sm:flex-row"
            role="status"
            aria-label="Loading engagement requests"
            data-testid="welcome-engagement-cta-suspense"
          />
        }
      >
        <div
          className="mt-6 flex w-full max-w-2xl flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-start"
          data-testid="welcome-engagement-request-row"
        >
          <WalkthroughRequestCta />
          <HeroEarlyAccessCta className="max-w-md" source="welcome-engagement" />
        </div>
      </Suspense>

      <p className={cn("mt-6 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
        <Link className={MARKETING_SURFACES.inlineLink} href="/signup">
          Start an evaluation
        </Link>
        {" · "}
        <Link className={MARKETING_SURFACES.inlineLink} href={appSiteHref("/auth/signin")}>
          Sign in
        </Link>
        {" · "}
        <Link className={MARKETING_SURFACES.inlineLink} href="/faq">
          Product FAQ
        </Link>
      </p>

      <div className="mt-6 max-w-3xl text-left" data-testid="welcome-proof-ladder">
        <p className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
          <Link className={MARKETING_SURFACES.inlineLink} href={WELCOME_PROOF_LADDER_SAMPLE_HREF}>
            {WELCOME_PROOF_LADDER_SAMPLE_LABEL}
          </Link>
          {" · "}
          <Link className={MARKETING_SURFACES.inlineLink} href={WELCOME_SEE_IT_HREF}>
            {WELCOME_SEE_IT_CTA_LABEL}
          </Link>
          {" · "}
          <Link className={MARKETING_SURFACES.inlineLink} href={WELCOME_PROOF_LADDER_SECONDARY_WALKTHROUGH_HREF}>
            {WELCOME_PROOF_LADDER_SECONDARY_WALKTHROUGH_LABEL}
          </Link>
          {" · "}
          <Link className={MARKETING_SURFACES.inlineLink} href={WELCOME_CONTOSO_ROI_PDF_HREF}>
            {WELCOME_CONTOSO_ROI_PDF_LABEL}
          </Link>
        </p>
        <p className={cn("mt-3", MARKETING_TYPOGRAPHY.meta)}>
          <Link className={MARKETING_SURFACES.inlineLink} href="/why">
            Why ArchLucid
          </Link>
          {" · "}
          <Link className={MARKETING_SURFACES.inlineLink} href="/trust">
            Trust center
          </Link>
        </p>
      </div>
    </section>
  );
}
