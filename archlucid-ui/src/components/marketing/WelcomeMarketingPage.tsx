"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { HeroEarlyAccessCta } from "@/components/marketing/HeroEarlyAccessCta";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MarketingTierPricingSection } from "@/components/marketing/MarketingTierPricingSection";
import { SelfDemoRequestCta } from "@/components/marketing/SelfDemoRequestCta";
import { WalkthroughRequestCta } from "@/components/marketing/WalkthroughRequestCta";
import { WelcomeMarketingProblemSolutionSection } from "@/components/marketing/WelcomeMarketingProblemSolutionSection";
import { WelcomeMarketingUseCasesSection } from "@/components/marketing/WelcomeMarketingUseCasesSection";
import { WelcomeMarketingWorkflowSection } from "@/components/marketing/WelcomeMarketingWorkflowSection";
import {
  WELCOME_HERO_CTA_SUBHEADING,
  WELCOME_HERO_EVALUATION_REASSURANCE,
  WELCOME_HERO_PITCH,
} from "@/components/marketing/welcome-marketing-copy";
import { Button } from "@/components/ui/button";
import { BUYER_MARKETING_PRICING_PAGE_INTRO } from "@/lib/buyer-polish-copy";
import { BRAND_CATEGORY } from "@/lib/brand-category";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";

type WelcomeVerifyLink = {
  readonly label: string;
  readonly href: string;
};

type WelcomePillar = {
  readonly title: string;
  readonly body: string;
  readonly verify: readonly WelcomeVerifyLink[];
};

function WelcomePillarVerifyLinks(props: { readonly links: readonly WelcomeVerifyLink[] }): ReactNode {
  const { links } = props;

  return (
    <p className={cn("mt-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
      <span className="font-semibold text-neutral-700 dark:text-neutral-300">Verify:</span>{" "}
      {links.map((link, index) => (
        <span key={`${link.href}|${link.label}`}>
          {index > 0 ? " · " : null}
          {link.href.startsWith("http") ? (
            <a
              className={MARKETING_SURFACES.inlineLink}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ) : link.href.endsWith(".zip") ? (
            <a className={MARKETING_SURFACES.inlineLink} href={link.href} download>
              {link.label}
            </a>
          ) : (
            <Link className={MARKETING_SURFACES.inlineLink} href={link.href}>
              {link.label}
            </Link>
          )}
        </span>
      ))}
    </p>
  );
}

/** Buyer-safe Verify anchors only — no `docs/library/*` contributor paths (TB-1297). */
const PILLARS: readonly WelcomePillar[] = [
  {
    title: "AI-native architecture analysis",
    body: "Specialized agents run the Capture → Evidence → Review path on real architecture context — topology, cost, compliance, and design quality — and produce a versioned review with structured findings, not a chat thread that disappears.",
    verify: [
      { label: "See it in 30 seconds", href: "/see-it" },
      { label: "Security & trust", href: "/security-trust" },
      { label: "Claims sample review", href: CANONICAL_ANONYMOUS_PROOF_HREF },
      { label: "Product overview", href: "/help/product-overview" },
    ],
  },
  {
    title: "Auditable decision trail",
    body: "Every recommendation ships with a chain of evidence: what was examined, which rules fired, what was decided, and why. Provenance and graph surfaces connect evidence to decisions for investigation — not an anonymous “AI said so” reply.",
    verify: [
      { label: "Claims sample review", href: CANONICAL_ANONYMOUS_PROOF_HREF },
      { label: "Evidence trail", href: "/help/evidence-trail" },
    ],
  },
  {
    title: "Enterprise governance",
    body: "Policy packs, approval workflows with segregation of duties, optional pre-commit gates, SLA tracking with webhook escalation, and typed audit events in an append-only store — the evidence profile buyers use for diligence.",
    verify: [
      { label: "Trust center", href: "/trust" },
      { label: "Evidence pack (ZIP)", href: "/v1/marketing/trust-center/evidence-pack.zip" },
      { label: "Audit trail", href: "/help/audit-trail" },
      { label: "Governance approval", href: "/help/governance-approval" },
    ],
  },
];

/** Public marketing landing: hero, problem/solution, workflow, use cases, proof, pillars, pricing. */
export function WelcomeMarketingPage(props: { readonly serverStaticSections?: ReactNode }) {
  const { serverStaticSections } = props;

  return (
    <MarketingPageShell>
      <section aria-labelledby="hero-heading" className="mb-12 text-center">
        <p
          className={MARKETING_TYPOGRAPHY.eyebrow}
          data-testid="welcome-brand-category-eyebrow"
        >
          {BRAND_CATEGORY}
        </p>
        <h1 id="hero-heading" className={`mt-2 ${MARKETING_TYPOGRAPHY.heroTitle} text-center`}>
          Defensible architecture, on demand.
        </h1>
        <p
          className={`mx-auto mt-4 max-w-3xl text-left ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary sm:text-center`}
          data-testid="welcome-hero-pitch"
        >
          {WELCOME_HERO_PITCH}
        </p>
        <div data-testid="welcome-hero-cta-stack" className="mt-8 flex w-full flex-col items-center gap-5">
          <p
            id="hero-cta-subheading"
            className={cn("max-w-2xl text-lg font-semibold leading-snug text-neutral-800 dark:text-neutral-100 sm:", OPERATOR_TYPOGRAPHY.pageTitle)}
            data-testid="welcome-hero-cta-subheading"
          >
            {WELCOME_HERO_CTA_SUBHEADING}
          </p>

          <p
            className={cn("max-w-2xl text-center leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}
            data-testid="welcome-hero-evaluation-reassurance"
          >
            {WELCOME_HERO_EVALUATION_REASSURANCE}
          </p>

          <div
            className="flex w-full max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center"
            data-testid="welcome-hero-primary-secondary-row"
            aria-labelledby="hero-cta-subheading"
          >
            <SelfDemoRequestCta />
            <WalkthroughRequestCta />
          </div>

          <div data-testid="welcome-hero-tertiary-region" className="flex w-full max-w-2xl flex-col items-center">
            <HeroEarlyAccessCta className="max-w-md" />
            <p className={cn("mt-2 max-w-lg text-center leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              <span className="font-medium text-neutral-700 dark:text-neutral-300">FAQ:</span>{" "}
              <Link
                className={MARKETING_SURFACES.inlineLink}
                href="/faq#how-many-files-upload"
              >
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
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3" data-testid="welcome-hero-secondary-actions">
            <Button asChild variant="ghost" size="sm">
              <Link href="/see-it">See it in 30 seconds</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/signup">Start an evaluation</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Canonical public sample:{" "}
            <Link className={MARKETING_SURFACES.inlineLink} href={CANONICAL_ANONYMOUS_PROOF_HREF}>
              Healthcare Claims Intake Modernization
            </Link>{" "}
            — illustrative sample review, no signup.{" "}
            <Link className={MARKETING_SURFACES.inlineLink} href="/see-it">
              See it in 30 seconds
            </Link>
            .
          </p>
          <p className={cn("mt-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            <Link className={MARKETING_SURFACES.inlineLink} href="/WORKED_EXAMPLE_ROI.pdf">
              See worked example (PDF)
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
            <Link className={MARKETING_SURFACES.inlineLink} href={CANONICAL_ANONYMOUS_PROOF_HREF}>
              Claims sample review
            </Link>
          </p>
        </div>
      </section>

      <WelcomeMarketingProblemSolutionSection />

      <WelcomeMarketingWorkflowSection />

      <WelcomeMarketingUseCasesSection />

      {serverStaticSections}

      <section aria-labelledby="pillars-heading" className="mb-14">
        <h2 id="pillars-heading" className={`mb-6 ${MARKETING_TYPOGRAPHY.sectionTitle}`}>
          Three pillars
        </h2>
        <ul className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <li key={pillar.title} className={MARKETING_SURFACES.cardComfort}>
              <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>{pillar.title}</h3>
              <p className={`mt-2 ${MARKETING_TYPOGRAPHY.body} text-al-text-secondary`}>{pillar.body}</p>
              <WelcomePillarVerifyLinks links={pillar.verify} />
            </li>
          ))}
        </ul>
      </section>

      <MarketingTierPricingSection
        sectionHeadingId="pricing-heading"
        sectionTitle="Packaging overview"
        sectionIntro={BUYER_MARKETING_PRICING_PAGE_INTRO}
        signupHref="/signup"
        showSignupCallToAction={false}
      />
    </MarketingPageShell>
  );
}
