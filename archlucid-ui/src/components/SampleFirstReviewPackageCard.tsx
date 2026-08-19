"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPE_SCALE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { recordCorePilotRailChecklistStep } from "@/lib/core-pilot-rail-telemetry";
import { OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY } from "@/lib/operator/operator-co-architect-copy";
import {
  BUYER_HOME_PRIMARY_CTA,
  BUYER_HOME_SAMPLE_PACKAGE_HEADLINE,
  BUYER_HOME_SAMPLE_PACKAGE_LEAD,
  BUYER_HOME_SECONDARY_CTA,
} from "@/lib/buyer/buyer-polish-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";

const sampleReviewHref = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

type SampleFirstReviewPackageCardProps = {
  /** Must match the home layout branch from {@link OperatorHomePageView} — do not re-read env in this card (hydration). */
  readonly buyerPolishedShell: boolean;
};

/** First-session shortcut: opens the curated sample review before the real-input wizard. */
export function SampleFirstReviewPackageCard({ buyerPolishedShell }: SampleFirstReviewPackageCardProps) {
  const buyerPolished = buyerPolishedShell;

  function recordSampleOpened(): void {
    recordCorePilotRailChecklistStep(3);
  }

  return (
    <section
      aria-labelledby="sample-first-review-heading"
      className={
        buyerPolished === true
          ? "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 p-4 shadow-sm"
          : "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 border-2 p-4 shadow-md ring-1 ring-neutral-200 dark:ring-neutral-800"
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id="sample-first-review-heading"
              className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-neutral-900 dark:text-neutral-50")}
            >
              {BUYER_HOME_SAMPLE_PACKAGE_HEADLINE}
            </h2>
            <DemoDataBadge />
          </div>

          {buyerPolished === true ? (
            <>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex min-h-[20px] items-center rounded-full border border-neutral-300 bg-al-surface-raised px-2.5 py-0.5 dark:border-neutral-600",
                    OPERATOR_TYPOGRAPHY.badge,
                    "text-al-text-primary",
                  )}
                >
                  Approved with monitoring
                </span>
                <span className={OPERATOR_TYPE_SCALE.helper}>
                  {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount} findings · {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.decisionCount} decisions · {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount} monitored risk
                </span>
              </div>
              <p className={cn("m-0 mt-2 max-w-2xl", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
                {BUYER_HOME_SAMPLE_PACKAGE_LEAD}
              </p>
            </>
          ) : (
            <>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex min-h-[20px] items-center rounded-full border border-neutral-300 bg-al-surface-raised px-2.5 py-0.5 dark:border-neutral-600",
                    OPERATOR_TYPOGRAPHY.badge,
                    "text-al-text-primary",
                  )}
                >
                  Approved with monitoring
                </span>
                <span className={OPERATOR_TYPE_SCALE.helper}>
                  {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount} findings · {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.decisionCount} decisions · {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount} monitored residual risk · audit evidence ready
                </span>
              </div>
              <p className={cn("m-0 mt-2 max-w-2xl", OPERATOR_TYPE_SCALE.body, "text-neutral-600 dark:text-neutral-400")}>
                {BUYER_HOME_SAMPLE_PACKAGE_LEAD}
              </p>
            </>
          )}

        </div>

        <div className="shrink-0 space-y-3 lg:min-w-64">
          {buyerPolished === true ? null : (
            <dl className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-neutral-200 px-2 py-2 dark:border-neutral-800">
                <dt className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Findings</dt>
                <dd className="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount}
                </dd>
              </div>
              <div className="rounded-lg border border-neutral-200 px-2 py-2 dark:border-neutral-800">
                <dt className={OPERATOR_TYPE_SCALE.micro}>Decisions</dt>
                <dd className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-neutral-900 dark:text-neutral-50")}>
                  {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.decisionCount}
                </dd>
              </div>
              <div className="rounded-lg border border-neutral-200 px-2 py-2 dark:border-neutral-800">
                <dt className={OPERATOR_TYPE_SCALE.micro}>Monitored risks</dt>
                <dd className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-neutral-900 dark:text-neutral-50")}>
                  {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount}
                </dd>
              </div>
            </dl>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {buyerPolished === true ? (
                <>
                  <Button asChild variant="primary" className="shadow-sm">
                    <Link href={sampleReviewHref} onClick={recordSampleOpened}>
                      {BUYER_HOME_PRIMARY_CTA}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="primary" className="h-9">
                    <Link href={sampleReviewHref} onClick={recordSampleOpened}>
                      {BUYER_HOME_PRIMARY_CTA}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-9">
                    <Link href="/architecture/reviews/new">{OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY}</Link>
                  </Button>
                </>
              )}
            </div>

            {buyerPolished === true ? (
              <div className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2">
                <Button asChild variant="outline">
                  <Link href="/architecture/reviews/new">
                    {BUYER_HOME_SECONDARY_CTA}
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
