"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

import { CtaButton } from "@/components/marketing/CtaButton";
import { MarketingPageShell } from "@/components/marketing/MarketingPageShell";
import { MarketingTierPricingSection } from "@/components/marketing/MarketingTierPricingSection";
import { SelfDemoRequestCta } from "@/components/marketing/SelfDemoRequestCta";
import { WelcomeMarketingProblemSolutionSection } from "@/components/marketing/WelcomeMarketingProblemSolutionSection";
import { WelcomeMarketingUseCasesSection } from "@/components/marketing/WelcomeMarketingUseCasesSection";
import { WelcomeMarketingWorkflowSection } from "@/components/marketing/WelcomeMarketingWorkflowSection";
import {
  WELCOME_HERO_PITCH,
  WELCOME_PROOF_LADDER_PRIMARY_HREF,
  WELCOME_SEE_IT_CTA_LABEL,
} from "@/components/marketing/welcome-marketing-copy";
import { BUYER_MARKETING_PRICING_PAGE_INTRO } from "@/lib/buyer-polish-copy";
import { BRAND_CATEGORY } from "@/lib/brand-category";
import { MARKETING_HERO_SECONDARY_CTA_CLASS, MARKETING_SURFACES, MARKETING_TYPOGRAPHY, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
      { label: WELCOME_SEE_IT_CTA_LABEL, href: WELCOME_PROOF_LADDER_PRIMARY_HREF },
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
        <div data-testid="welcome-hero-cta-stack" className="mt-8 flex w-full flex-col items-center gap-4">
          <div
            className="flex w-full max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center"
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
