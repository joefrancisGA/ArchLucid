import Link from "next/link";
import type { ReactNode } from "react";

import { WelcomeMarketingHeroSection } from "@/components/marketing/WelcomeMarketingHeroSection";
import { WelcomeEvidenceOrientationStrip } from "@/components/marketing/WelcomeEvidenceOrientationStrip";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { WelcomeMarketingProblemSolutionSection } from "@/components/marketing/WelcomeMarketingProblemSolutionSection";
import { WelcomeMarketingUseCasesSection } from "@/components/marketing/WelcomeMarketingUseCasesSection";
import { WelcomeMarketingWorkflowSection } from "@/components/marketing/WelcomeMarketingWorkflowSection";
import { MarketingTierPricingSectionDeferred } from "@/components/marketing/welcome-marketing-deferred-chunks";
import { WELCOME_SEE_IT_CTA_LABEL, WELCOME_PROOF_LADDER_PRIMARY_HREF } from "@/components/marketing/welcome-marketing-copy";
import { BUYER_MARKETING_PRICING_PAGE_INTRO } from "@/lib/buyer/buyer-polish-copy";
import { MARKETING_LAYOUT, MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { PricingDoc } from "@/lib/pricing-types";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";
import { cn } from "@/lib/utils";

type WelcomePillar = {
  readonly title: string;
  readonly body: string;
  readonly verifyLabel: string;
  readonly verifyHref: string;
};

/** Buyer-safe Verify anchors only — no `docs/library/*` contributor paths (TB-1297). */
const PILLARS: readonly WelcomePillar[] = [
  {
    title: "AI-native architecture analysis",
    body: "Specialized agents analyze architecture structure, cost, compliance, and design quality, then produce a versioned review with structured findings — not a chat thread that disappears.",
    verifyLabel: WELCOME_SEE_IT_CTA_LABEL,
    verifyHref: WELCOME_PROOF_LADDER_PRIMARY_HREF,
  },
  {
    title: "Auditable decision trail",
    body: "Every recommendation carries its chain of evidence: what was examined, which rules fired, what was decided, and why — not an anonymous “AI said so” reply.",
    verifyLabel: "Evidence trail",
    verifyHref: "/help/evidence-trail",
  },
  {
    title: "Enterprise governance",
    body: "Policy packs, approvals with segregation of duties, SLA tracking, and typed audit events in an append-only store — the evidence profile buyers use for diligence.",
    verifyLabel: "Trust center",
    verifyHref: "/trust",
  },
];

function WelcomePillarVerifyLink(props: { readonly label: string; readonly href: string }): ReactNode {
  const { label, href } = props;

  return (
    <p className={cn("mt-3", MARKETING_TYPOGRAPHY.meta)}>
      <span className="font-semibold text-al-text-primary">Verify:</span>{" "}
      {href.endsWith(".zip") ? (
        <a className={MARKETING_SURFACES.inlineLink} href={href} download>
          {label}
        </a>
      ) : (
        <Link className={MARKETING_SURFACES.inlineLink} href={href}>
          {label}
        </Link>
      )}
    </p>
  );
}

/** Public marketing landing: hero, problem/solution, workflow, use cases, proof, pillars, pricing. */
export function WelcomeMarketingPage(props: {
  readonly serverStaticSections?: ReactNode;
  /** Server-read pricing catalog passed through to the tier grid (skips the loading skeleton). */
  readonly initialPricing?: PricingDoc | null;
}) {
  const { serverStaticSections, initialPricing } = props;

  return (
    <>
      <WelcomeMarketingHeroSection />
      <MarketingPageShell>
        <WelcomeEvidenceOrientationStrip />
        <WelcomeMarketingProblemSolutionSection />

        <WelcomeMarketingWorkflowSection />

        {serverStaticSections}

        <WelcomeMarketingUseCasesSection />

        <section aria-labelledby="pillars-heading" className={MARKETING_LAYOUT.sectionStack}>
          <h2 id="pillars-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
            Three pillars
          </h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {PILLARS.map((pillar) => (
              <li key={pillar.title} className={MARKETING_SURFACES.cardComfort}>
                <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>{pillar.title}</h3>
                <p className={cn("mt-2", MARKETING_TYPOGRAPHY.body, "text-al-text-secondary")}>{pillar.body}</p>
                <WelcomePillarVerifyLink label={pillar.verifyLabel} href={pillar.verifyHref} />
              </li>
            ))}
          </ul>
          <p className={cn("mt-4", MARKETING_TYPOGRAPHY.meta)}>
            <Link className={MARKETING_SURFACES.inlineLink} href={CANONICAL_ANONYMOUS_PROOF_HREF}>
              Healthcare Claims sample review
            </Link>
            {" · "}
            <Link className={MARKETING_SURFACES.inlineLink} href="/security-trust">
              Assurance status
            </Link>
          </p>
        </section>

        <MarketingTierPricingSectionDeferred
          sectionHeadingId="pricing-heading"
          sectionTitle="Packaging overview"
          sectionIntro={BUYER_MARKETING_PRICING_PAGE_INTRO}
          signupHref="/signup"
          showSignupCallToAction={false}
          initialPricing={initialPricing}
        />
      </MarketingPageShell>
    </>
  );
}
