"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";
import { recordCorePilotRailChecklistStep } from "@/lib/core-pilot-rail-telemetry";
import { OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY } from "@/lib/operator-co-architect-copy";
import { BUYER_HOME_PRIMARY_CTA, BUYER_HOME_SAMPLE_PACKAGE_LEAD, BUYER_HOME_SAMPLE_PACKAGE_SUBTITLE, BUYER_HOME_SECONDARY_CTA } from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE,
  SHOWCASE_STATIC_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_SPINE_COUNTS,
} from "@/lib/showcase-static-demo";

const sampleReviewHref = `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

/** First-session shortcut: opens the curated sample review package before the real-input wizard. */
export function SampleFirstReviewPackageCard() {
  const buyerPolished = isBuyerPolishedOperatorShellEnv();

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
              className="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-50"
            >
              {buyerPolished === true ? SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE : "Start with a completed architecture review package"}
            </h2>

          </div>

          {buyerPolished === true ? (
            <>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-neutral-300 bg-al-surface-raised px-2.5 py-0.5 text-xs font-semibold text-al-text-primary dark:border-neutral-600">
                  Approved with monitoring
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount} findings · {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.decisionCount} decisions · {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount} monitored risk
                </span>
              </div>
              <p className="m-0 mt-1 text-sm text-neutral-500 dark:text-neutral-400">{BUYER_HOME_SAMPLE_PACKAGE_SUBTITLE}</p>
              <p className="m-0 mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                {BUYER_HOME_SAMPLE_PACKAGE_LEAD}
              </p>
            </>
          ) : (
            <>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-neutral-300 bg-al-surface-raised px-2.5 py-0.5 text-xs font-semibold text-al-text-primary dark:border-neutral-600">
                  Approved with monitoring
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount} findings · {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.decisionCount} decisions · {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount} monitored residual risk · audit evidence ready
                </span>
              </div>
              <p className="m-0 mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                Open the Claims Intake sample to see the reviewed manifest, evidence trail, findings, and artifacts before
                filling out the real-input wizard.
              </p>
            </>
          )}

          {buyerPolished === true ? null : (
            <p className="m-0 mt-2 text-xs text-amber-800 dark:text-amber-300">
              Illustrative sample review — use it to understand output shape, not as customer ROI evidence.
            </p>
          )}
        </div>

        <div className="shrink-0 space-y-3 lg:min-w-64">
          {buyerPolished === true ? null : (
            <dl className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-neutral-200 px-2 py-2 dark:border-neutral-800">
                <dt className="text-[11px] text-neutral-500 dark:text-neutral-400">Findings</dt>
                <dd className="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount}
                </dd>
              </div>
              <div className="rounded-lg border border-neutral-200 px-2 py-2 dark:border-neutral-800">
                <dt className="text-[11px] text-neutral-500 dark:text-neutral-400">Decisions</dt>
                <dd className="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.decisionCount}
                </dd>
              </div>
              <div className="rounded-lg border border-neutral-200 px-2 py-2 dark:border-neutral-800">
                <dt className="text-[11px] text-neutral-500 dark:text-neutral-400">Monitored risks</dt>
                <dd className="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount}
                </dd>
              </div>
            </dl>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {buyerPolished === true ? (
                <>
                  <Button asChild variant="primary" size="lg" className="h-11 min-h-[44px] px-7 text-base shadow-sm">
                    <Link href={getShowcaseExecutiveHref()} onClick={recordSampleOpened}>
                      {BUYER_HOME_PRIMARY_CTA}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="primary" className="h-9">
                    <Link href={sampleReviewHref} onClick={recordSampleOpened}>
                      Open sample review package
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-9">
                    <Link href="/reviews/new">{OPERATOR_CO_ARCHITECT_CTA_REVIEW_PRIMARY}</Link>
                  </Button>
                </>
              )}
            </div>

            {buyerPolished === true ? (
              <div className="m-0 flex flex-wrap items-center gap-x-3 gap-y-2">
                <Button asChild variant="outline" size="lg" className="h-11 min-h-[44px] px-7 text-base">
                  <Link href={sampleReviewHref} onClick={recordSampleOpened}>
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
