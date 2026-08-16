"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { GetStartedEvidenceOrientationStrip } from "@/components/marketing/GetStartedEvidenceOrientationStrip";
import { GetStartedScopeDisclosure } from "@/components/marketing/get-started/GetStartedScopeDisclosure";
import { TrustCenterRevisionHistory } from "@/components/marketing/trust-center/TrustCenterRevisionHistory";
import {
  GET_STARTED_HELP_GETTING_STARTED_HREF,
  buildGuidedTrialHref,
  buildSignInTrialHref,
  GET_STARTED_HERO_LEAD,
  GET_STARTED_LAST_REVIEWED_LABEL,
  GET_STARTED_MILESTONES,
  GET_STARTED_OUTCOME_STATEMENT,
  GET_STARTED_PAGE_TITLE,
  GET_STARTED_PRIMARY_CONTENT_ID,
  GET_STARTED_REAL_REVIEW_NOTE,
  GET_STARTED_REVIEW_OUTPUTS,
  GET_STARTED_SAMPLE_DISCLOSURE,
  GET_STARTED_SAMPLE_PATH_NOTE,
  GET_STARTED_VERTICAL_PRESENTATIONS,
  type GetStartedPathId,
} from "@/app/(marketing)/get-started/get-started-content";
import { MARKETING_SURFACES, MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import { GET_STARTED_REVISION_HISTORY } from "@/lib/get-started-marketing-revision-history";
import { resolveInAppDocHref } from "@/lib/in-app-doc-href";
import { TRUST_CENTER_PUBLIC_EVIDENCE_VERSION } from "@/lib/trust-center-buyer-content";
import { TRUST_CENTER_PUBLIC_LAYOUT } from "@/lib/trust-center-public-layout";

function PathBadge({ children }: { children: string }): ReactElement {
  return (
    <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs font-medium text-al-text-secondary dark:border-neutral-700">
      {children}
    </span>
  );
}

function scrollToSection(elementId: string): void {
  const target = document.getElementById(elementId);

  if (target !== null) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function GetStartedPageClient(): ReactElement {
  const [selectedPath, setSelectedPath] = useState<GetStartedPathId>("trial");

  function selectSamplePath(): void {
    setSelectedPath("sample");
    scrollToSection("choose-sample");
  }

  function selectTrialPath(): void {
    setSelectedPath("trial");
    scrollToSection("guided-milestones");
  }

  return (
    <div className="space-y-12" data-testid="get-started-page">
      <a href={`#${GET_STARTED_PRIMARY_CONTENT_ID}`} className={TRUST_CENTER_PUBLIC_LAYOUT.skipLink}>
        Skip to get started content
      </a>

      <header className="max-w-3xl border-b border-neutral-200 pb-8 dark:border-neutral-800">
        <h1 className={MARKETING_TYPOGRAPHY.pageTitle}>{GET_STARTED_PAGE_TITLE}</h1>
        <p className={cn("mt-3 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)} data-testid="get-started-hero-lead">
          {GET_STARTED_HERO_LEAD}
        </p>
        <p
          className={cn("mt-3 text-al-text-primary", MARKETING_TYPOGRAPHY.body)}
          data-testid="get-started-outcome-led-lead"
        >
          {GET_STARTED_OUTCOME_STATEMENT}
        </p>
        <div className={TRUST_CENTER_PUBLIC_LAYOUT.metaRow} data-testid="get-started-hero-meta">
          <span className={TRUST_CENTER_PUBLIC_LAYOUT.lastReviewed}>
            Last reviewed{" "}
            <time dateTime={GET_STARTED_LAST_REVIEWED_LABEL}>{GET_STARTED_LAST_REVIEWED_LABEL}</time>
          </span>
          <span className={TRUST_CENTER_PUBLIC_LAYOUT.metaSecondary}>
            Orientation pack version {TRUST_CENTER_PUBLIC_EVIDENCE_VERSION}
          </span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="primary" data-testid="get-started-primary-trial-cta">
            <Link href={buildGuidedTrialHref()} data-analytics-event="get-started-start-guided-trial">
              Start guided trial
            </Link>
          </Button>
          <Button asChild variant="outline" data-testid="get-started-secondary-sample-cta">
            <Link href="#choose-sample" data-analytics-event="get-started-explore-sample">
              Explore a sample
            </Link>
          </Button>
        </div>
        <p className={cn("mt-4", MARKETING_TYPOGRAPHY.meta)}>
          <Link className={MARKETING_SURFACES.inlineLink} href={GET_STARTED_HELP_GETTING_STARTED_HREF}>
            Learn more in Getting started help
          </Link>
        </p>
      </header>

      <GetStartedScopeDisclosure />

      <div id={GET_STARTED_PRIMARY_CONTENT_ID} className="scroll-mt-24 space-y-12">
        <section aria-labelledby="path-selection-heading">
          <h2 id="path-selection-heading" className="sr-only">
            Choose your path
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <article
              className={cn(
                MARKETING_SURFACES.cardComfort,
                selectedPath === "sample" ? "border-teal-600 ring-2 ring-teal-600/30 dark:border-teal-500" : "",
              )}
            >
              <p className={cn("m-0", MARKETING_TYPOGRAPHY.eyebrow)}>Explore without signing in</p>
              <h3 className={cn("mt-2", MARKETING_TYPOGRAPHY.sectionTitle)}>Open an illustrative review</h3>
              <p className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
                Choose an industry and inspect a completed sample review immediately.
              </p>
              <p className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
                Best for understanding the review output before creating a workspace.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PathBadge>No credit card</PathBadge>
                <PathBadge>No local installation</PathBadge>
                <PathBadge>No sign-in</PathBadge>
              </div>
              <Button
                type="button"
                className="mt-5"
                variant={selectedPath === "sample" ? "primary" : "outline"}
                onClick={selectSamplePath}
                data-testid="get-started-choose-sample-path"
              >
                Choose a sample
              </Button>
            </article>

            <article
              className={cn(
                MARKETING_SURFACES.cardComfort,
                selectedPath === "trial" ? "border-teal-600 ring-2 ring-teal-600/30 dark:border-teal-500" : "",
              )}
            >
              <p className={cn("m-0", MARKETING_TYPOGRAPHY.eyebrow)}>Guided trial</p>
              <h3 className={cn("mt-2", MARKETING_TYPOGRAPHY.sectionTitle)}>Create your first review</h3>
              <p className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
                Sign in with a supported identity or verify your email with a one-time code, choose an industry profile,
                and complete a guided sample review in approximately 30 minutes.
              </p>
              <p className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
                Best for experiencing the review workflow inside an ArchLucid workspace.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PathBadge>No credit card</PathBadge>
                <PathBadge>No local installation</PathBadge>
                <PathBadge>Sign-in required</PathBadge>
              </div>
              <Button
                type="button"
                className="mt-5"
                variant={selectedPath === "trial" ? "primary" : "outline"}
                onClick={selectTrialPath}
                data-testid="get-started-choose-trial-path"
              >
                Start guided trial
              </Button>
            </article>
          </div>
        </section>

        <section
          id="choose-sample"
          aria-labelledby="sample-vertical-heading"
          className={cn("scroll-mt-24", selectedPath !== "sample" && "opacity-80")}
          data-testid="get-started-sample-path"
        >
          <h2 id="sample-vertical-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
            Choose an illustrative review
          </h2>
          <p className={cn("mt-2 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            Select an industry to open a completed sample review. No sign-in is required.
          </p>
          <p className={cn("mt-2 max-w-3xl text-al-text-primary", MARKETING_TYPOGRAPHY.meta)}>
            {GET_STARTED_SAMPLE_PATH_NOTE}
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list" data-testid="get-started-vertical-picker">
            {GET_STARTED_VERTICAL_PRESENTATIONS.map((vertical) => {
              const Icon = vertical.icon;

              return (
                <li key={vertical.slug}>
                  <Link
                    href={vertical.publicSampleHref}
                    data-testid={`get-started-vertical-${vertical.slug}`}
                    data-vertical-slug={vertical.slug}
                    data-analytics-event="get-started-open-public-sample"
                    data-analytics-vertical={vertical.slug}
                    aria-label={vertical.publicSampleAccessibleName}
                    className={cn(
                      "group flex h-full flex-col gap-2 no-underline",
                      MARKETING_SURFACES.card,
                      "transition hover:border-[var(--al-accent-interactive)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800">
                        <Icon className="h-5 w-5 text-teal-800 dark:text-teal-300" aria-hidden />
                      </span>
                      <div>
                        <p className={cn("m-0 font-semibold text-al-text-primary", MARKETING_TYPOGRAPHY.cardTitle)}>
                          {vertical.label}
                        </p>
                        <p className={cn("m-0 mt-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
                          {vertical.scenario}
                        </p>
                      </div>
                    </div>
                    <p className={cn("m-0 mt-auto text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>
                      Opens illustrative sample review
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section
          id="guided-milestones"
          aria-labelledby="guided-milestones-heading"
          className={cn("scroll-mt-24", selectedPath !== "trial" && "opacity-80")}
          data-testid="get-started-guided-path"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="guided-milestones-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
              Complete a guided review in four milestones
            </h2>
            <p className={cn("m-0 text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>Approximately 30 minutes total</p>
          </div>
          <ol className="mt-6 grid gap-4 lg:grid-cols-4" data-testid="get-started-steps">
            {GET_STARTED_MILESTONES.map((milestone) => (
              <li
                key={milestone.n}
                data-testid={`get-started-step-${milestone.n}`}
                className={cn(MARKETING_SURFACES.card, "flex h-full flex-col")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={MARKETING_SURFACES.stepIndicator} data-testid={`get-started-step-${milestone.n}-indicator`}>
                    {milestone.n}
                  </span>
                  <span className={cn("text-al-text-secondary", MARKETING_TYPOGRAPHY.meta)}>{milestone.estimate}</span>
                </div>
                <h3 className={cn("mt-3", MARKETING_TYPOGRAPHY.cardTitle)}>{milestone.title}</h3>
                <p className={cn("mt-2 flex-1 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{milestone.body}</p>
                <p className={cn("mt-3 text-al-text-primary", MARKETING_TYPOGRAPHY.meta)}>
                  <span className="font-medium">Outcome:</span> {milestone.outcome}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="primary">
              <Link href={buildGuidedTrialHref()} data-analytics-event="get-started-milestone-start-trial">
                Start guided trial
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={buildSignInTrialHref()} data-analytics-event="get-started-milestone-sign-in">
                Sign in to continue
              </Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="review-output-heading">
          <h2 id="review-output-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
            What your first review includes
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GET_STARTED_REVIEW_OUTPUTS.map((output) => (
              <article key={output.title} className={MARKETING_SURFACES.card}>
                <h3 className={MARKETING_TYPOGRAPHY.cardTitle}>{output.title}</h3>
                <p className={cn("mt-2 text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>{output.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="sample-disclosure-heading" className={MARKETING_SURFACES.mutedPanel}>
          <h2 id="sample-disclosure-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
            About the sample
          </h2>
          <p className={cn("mt-2 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            {GET_STARTED_SAMPLE_DISCLOSURE}
          </p>
          <p className={cn("mt-3 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            {GET_STARTED_REAL_REVIEW_NOTE}
          </p>
        </section>

        <section
          aria-labelledby="next-heading"
          className={cn(MARKETING_SURFACES.highlightPanel, "p-6")}
          data-testid="get-started-next-step-panel"
        >
          <h2 id="next-heading" className={MARKETING_TYPOGRAPHY.sectionTitle}>
            Ready to go further?
          </h2>
          <p className={cn("mt-2 max-w-3xl text-al-text-secondary", MARKETING_TYPOGRAPHY.body)}>
            Use your own architecture material to create a governed review with evidence, findings, decisions, and reusable
            deliverables.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild variant="primary">
              <Link href={buildGuidedTrialHref()} data-analytics-event="get-started-start-guided-evaluation">
                Continue in onboarding
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing" data-analytics-event="get-started-view-pricing">
                View pricing
              </Link>
            </Button>
          </div>
          <p className={cn("mt-4", MARKETING_TYPOGRAPHY.meta)}>
            <Link
              className={MARKETING_SURFACES.inlineLink}
              href={resolveInAppDocHref("docs/go-to-market/SPONSOR_SPONSOR_BRIEF.md")}
            >
              Read the sponsor brief
            </Link>
            {" · "}
            <Link
              className={MARKETING_SURFACES.inlineLink}
              href="#choose-sample"
              data-analytics-event="get-started-open-another-sample"
            >
              Open another illustrative sample
            </Link>
          </p>
        </section>

        <TrustCenterRevisionHistory entries={GET_STARTED_REVISION_HISTORY} />
      </div>

      <GetStartedEvidenceOrientationStrip />
    </div>
  );
}
