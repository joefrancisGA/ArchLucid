"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { HeroEarlyAccessCta } from "@/components/marketing/HeroEarlyAccessCta";
import { MarketingTierPricingSection } from "@/components/marketing/MarketingTierPricingSection";
import { SelfDemoRequestCta } from "@/components/marketing/SelfDemoRequestCta";
import { WalkthroughRequestCta } from "@/components/marketing/WalkthroughRequestCta";
import { WelcomeMarketingProblemSolutionSection } from "@/components/marketing/WelcomeMarketingProblemSolutionSection";
import { WelcomeMarketingUseCasesSection } from "@/components/marketing/WelcomeMarketingUseCasesSection";
import { WelcomeMarketingWorkflowSection } from "@/components/marketing/WelcomeMarketingWorkflowSection";
import {
  WELCOME_HERO_CTA_SUBHEADING,
  WELCOME_HERO_PITCH,
} from "@/components/marketing/welcome-marketing-copy";
import { Button } from "@/components/ui/button";
import { BUYER_MARKETING_PRICING_PAGE_INTRO } from "@/lib/buyer-polish-copy";
import { BRAND_CATEGORY } from "@/lib/brand-category";
import { DEFAULT_GITHUB_BLOB_BASE } from "@/lib/docs-public-base";

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
    <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400">
      <span className="font-semibold text-neutral-700 dark:text-neutral-300">Verify:</span>{" "}
      {links.map((link, index) => (
        <span key={`${link.href}|${link.label}`}>
          {index > 0 ? " · " : null}
          {link.href.startsWith("http") ? (
            <a
              className="text-teal-700 underline underline-offset-2 dark:text-teal-300"
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ) : link.href.endsWith(".zip") ? (
            <a className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href={link.href} download>
              {link.label}
            </a>
          ) : (
            <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href={link.href}>
              {link.label}
            </Link>
          )}
        </span>
      ))}
    </p>
  );
}

const PILLARS: readonly WelcomePillar[] = [
  {
    title: "AI-native architecture analysis",
    body: "Specialized agents run the Capture → Evidence → Review path on real architecture context — topology, cost, compliance, and design quality — and produce a versioned manifest with structured findings, not a chat thread that disappears.",
    verify: [
      { label: "See it in 30 seconds", href: "/see-it" },
      { label: "Security & trust", href: "/security-trust" },
      { label: "Demo preview", href: "/demo/preview" },
      { label: "Product scope overview", href: `${DEFAULT_GITHUB_BLOB_BASE}/docs/library/V1_SCOPE.md` },
    ],
  },
  {
    title: "Auditable decision trail",
    body: "Every recommendation ships with a chain of evidence: what was examined, which rules fired, what was decided, and why. Provenance and graph surfaces connect evidence to decisions for investigation — not an anonymous “AI said so” reply.",
    verify: [
      { label: "Evidence trail demo", href: "/demo/preview" },
      { label: "Knowledge graph overview", href: `${DEFAULT_GITHUB_BLOB_BASE}/docs/library/KNOWLEDGE_GRAPH.md` },
    ],
  },
  {
    title: "Enterprise governance",
    body: "Policy packs, approval workflows with segregation of duties, optional pre-commit gates, SLA tracking with webhook escalation, and typed audit events in an append-only store — the evidence profile buyers use for diligence.",
    verify: [
      { label: "Trust center", href: "/trust" },
      { label: "Evidence pack (ZIP)", href: "/v1/marketing/trust-center/evidence-pack.zip" },
      { label: "Audit event coverage", href: `${DEFAULT_GITHUB_BLOB_BASE}/docs/library/AUDIT_COVERAGE_MATRIX.md` },
      { label: "Pre-commit governance", href: `${DEFAULT_GITHUB_BLOB_BASE}/docs/library/PRE_COMMIT_GOVERNANCE_GATE.md` },
    ],
  },
];

/** Public marketing landing: hero, problem/solution, workflow, use cases, proof, pillars, pricing. */
export function WelcomeMarketingPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section aria-labelledby="hero-heading" className="mb-12 text-center">
        <p
          className="text-sm font-semibold uppercase tracking-wide text-teal-800 dark:text-teal-300"
          data-testid="welcome-brand-category-eyebrow"
        >
          {BRAND_CATEGORY}
        </p>
        <h1 id="hero-heading" className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl">
          Defensible architecture, on demand.
        </h1>
        <p
          className="mx-auto mt-4 max-w-3xl text-left text-base leading-relaxed text-neutral-700 dark:text-neutral-300 sm:text-center"
          data-testid="welcome-hero-pitch"
        >
          {WELCOME_HERO_PITCH}
        </p>
        <div data-testid="welcome-hero-cta-stack" className="mt-8 flex w-full flex-col items-center gap-5">
          <p
            id="hero-cta-subheading"
            className="max-w-2xl text-lg font-semibold leading-snug text-neutral-800 dark:text-neutral-100 sm:text-xl"
            data-testid="welcome-hero-cta-subheading"
          >
            {WELCOME_HERO_CTA_SUBHEADING}
          </p>

          <div
            className="flex w-full max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-center"
            data-testid="welcome-hero-primary-secondary-row"
            aria-labelledby="hero-cta-subheading"
          >
            <WalkthroughRequestCta className="h-11 min-h-11 w-full px-8 text-base font-bold shadow-sm sm:w-auto sm:min-w-[12rem]" />
            <SelfDemoRequestCta />
          </div>

          <div data-testid="welcome-hero-tertiary-region" className="flex w-full max-w-2xl flex-col items-center">
            <HeroEarlyAccessCta className="max-w-md" />
            <p className="mt-2 max-w-lg text-center text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
              <span className="font-medium text-neutral-700 dark:text-neutral-300">FAQ:</span>{" "}
              <Link
                className="text-teal-800 underline underline-offset-2 dark:text-teal-300"
                href="/faq#bulk-upload-30-files"
              >
                Bulk upload limit (30 files)
              </Link>
              {" · "}
              <Link className="text-teal-800 underline underline-offset-2 dark:text-teal-300" href="/faq#demo-workspaces">
                Demo workspaces
              </Link>
              .
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:gap-3" data-testid="welcome-hero-secondary-actions">
            <Button asChild variant="outline" size="lg">
              <Link href="/see-it">See it in 30 seconds</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/signup">Start free trial</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Same finalized demo as{" "}
            <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/demo/preview">
              the demo preview page
            </Link>{" "}
            — full page, no signup.{" "}
            <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/demo/preview">
              See the evidence trail walkthrough
            </Link>
            .
          </p>
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
            <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/WORKED_EXAMPLE_ROI.pdf">
              See worked example (PDF)
            </Link>{" "}
            — Contoso sample ROI (fictional tenant). Ask your account team for the written walkthrough companion.
          </p>
          <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="font-semibold text-neutral-600 dark:text-neutral-300">Verify:</span>{" "}
            <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/why">
              Why ArchLucid
            </Link>
            {" · "}
            <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/trust">
              Trust center
            </Link>
            {" · "}
            <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/demo/preview">
              Evidence trail demo
            </Link>
          </p>
        </div>
      </section>

      <WelcomeMarketingProblemSolutionSection />

      <WelcomeMarketingWorkflowSection />

      <WelcomeMarketingUseCasesSection />

      <section
        aria-labelledby="welcome-proof-heading"
        className="mb-12"
        data-testid="welcome-proof-at-a-glance"
      >
        <h2 id="welcome-proof-heading" className="mb-4 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Proof at a glance
        </h2>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-3">
          <li className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Decision-grade outputs</p>
            <p className="m-0 mt-2 text-sm leading-snug text-neutral-600 dark:text-neutral-400">
              Structured findings with a versioned manifest you can hand to ARB and audit partners.
            </p>
            <p className="m-0 mt-3 text-xs font-medium">
              <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/why">
                Why teams standardize on ArchLucid
              </Link>
            </p>
          </li>
          <li className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Evidence you can follow</p>
            <p className="m-0 mt-2 text-sm leading-snug text-neutral-600 dark:text-neutral-400">
              Trace graph tie-outs and audit milestones—not an ephemeral chat transcript.
            </p>
            <p className="m-0 mt-3 text-xs font-medium">
              <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/see-it">
                See it in 30 seconds
              </Link>
            </p>
          </li>
          <li className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <p className="m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Procurement-ready posture</p>
            <p className="m-0 mt-2 text-sm leading-snug text-neutral-600 dark:text-neutral-400">
              Published Trust Center materials and downloadable diligence anchors—know what to verify.
            </p>
            <p className="m-0 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
              <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/trust">
                Open Trust Center
              </Link>
              <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/security-trust">
                Security and trust detail
              </Link>
            </p>
          </li>
        </ul>
      </section>

      <section aria-labelledby="walkthrough-heading" className="mb-14 rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <h2 id="walkthrough-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          First-time visitor path
        </h2>
        <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">
          Hosted SaaS Core Pilot: create an architecture review request, let the pipeline finish, finalize when ready,
          then open your review package — no local Docker required for the buyer story.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
          <li>
            <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/see-it">
              See it (30s)
            </Link>{" "}
            — fastest visual proof; then{" "}
            <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/why">
              Why ArchLucid
            </Link>{" "}
            for positioning depth.
          </li>
          <li>
            <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/compliance-journey">
              Compliance journey
            </Link>{" "}
            — how reviewers map controls to shipped mechanisms.
          </li>
          <li>
            <Link className="text-teal-700 underline underline-offset-2 dark:text-teal-300" href="/trust">
              Trust Center
            </Link>
            , privacy, and procurement-linked evidence.
          </li>
        </ol>
      </section>

      <section aria-labelledby="pillars-heading" className="mb-14">
        <h2 id="pillars-heading" className="mb-6 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Three pillars
        </h2>
        <ul className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <li
              key={pillar.title}
              className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{pillar.body}</p>
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
    </main>
  );
}
