"use client";

import Link from "next/link";

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
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { appSiteHref } from "@/lib/site-urls";
import { cn } from "@/lib/utils";

/** Below-fold engagement + proof ladder — demoted from hero (TB-1294–TB-1296). */
export function WelcomeMarketingEngagementPathsSection(): React.JSX.Element {
  return (
    <section
      aria-labelledby="welcome-engagement-heading"
      className="mb-12"
      data-testid="welcome-engagement-paths"
    >
      <h2 id="welcome-engagement-heading" className={`mb-4 ${MARKETING_TYPOGRAPHY.sectionTitle}`}>
        {WELCOME_ENGAGEMENT_PATHS_HEADING}
      </h2>
      <p
        className={cn("max-w-3xl leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
        data-testid="welcome-engagement-subheading"
      >
        {WELCOME_HERO_CTA_SUBHEADING}
      </p>
      <p
        className={cn("mt-3 max-w-3xl leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
        data-testid="welcome-engagement-reassurance"
      >
        {WELCOME_HERO_EVALUATION_REASSURANCE}
      </p>

      <div
        className="mt-6 flex w-full max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start"
        data-testid="welcome-engagement-request-row"
      >
        <WalkthroughRequestCta />
        <HeroEarlyAccessCta className="max-w-md" source="welcome-engagement" />
      </div>

      <p className={cn("mt-4 max-w-3xl leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        <span className="font-medium text-neutral-700 dark:text-neutral-300">FAQ:</span>{" "}
        <Link className={MARKETING_SURFACES.inlineLink} href="/faq#how-many-files-upload">
          How many files can I upload?
        </Link>
        {" · "}
        <Link className={MARKETING_SURFACES.inlineLink} href="/faq#demo-workspaces">
          Demo workspaces
        </Link>
        {" · "}
        <Link className={MARKETING_SURFACES.inlineLink} href="/faq">
          Product FAQ
        </Link>
        .
      </p>

      <p className={cn("mt-4 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        <Link className={MARKETING_SURFACES.inlineLink} href="/signup">
          Start an evaluation
        </Link>
        {" · "}
        <Link className={MARKETING_SURFACES.inlineLink} href={appSiteHref("/auth/signin")}>
          Sign in
        </Link>
      </p>

      <div className="mt-6 max-w-3xl text-left" data-testid="welcome-proof-ladder">
        <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Canonical public sample:{" "}
          <Link className={MARKETING_SURFACES.inlineLink} href={WELCOME_PROOF_LADDER_SAMPLE_HREF}>
            {WELCOME_PROOF_LADDER_SAMPLE_LABEL}
          </Link>{" "}
          — illustrative sample review, no signup.{" "}
          <Link className={MARKETING_SURFACES.inlineLink} href={WELCOME_SEE_IT_HREF}>
            {WELCOME_SEE_IT_CTA_LABEL}
          </Link>
          .
        </p>
        <p className={cn("mt-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          <Link
            className={MARKETING_SURFACES.inlineLink}
            href={WELCOME_PROOF_LADDER_SECONDARY_WALKTHROUGH_HREF}
          >
            {WELCOME_PROOF_LADDER_SECONDARY_WALKTHROUGH_LABEL}
          </Link>
          {" · "}
          <Link className={MARKETING_SURFACES.inlineLink} href={WELCOME_CONTOSO_ROI_PDF_HREF}>
            {WELCOME_CONTOSO_ROI_PDF_LABEL}
          </Link>{" "}
          — fictional Contoso ROI numbers for illustration only (not the Claims showcase package).
        </p>
        <p className={cn("mt-3 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <span className="font-semibold text-neutral-600 dark:text-neutral-300">Verify:</span>{" "}
          <Link className={MARKETING_SURFACES.inlineLink} href="/why">
            Why ArchLucid
          </Link>
          {" · "}
          <Link className={MARKETING_SURFACES.inlineLink} href="/trust">
            Trust center
          </Link>
          {" · "}
          <Link className={MARKETING_SURFACES.inlineLink} href={WELCOME_PROOF_LADDER_SAMPLE_HREF}>
            Claims sample review
          </Link>
        </p>
      </div>
    </section>
  );
}
