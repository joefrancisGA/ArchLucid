"use client";

import { Info } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getShowcaseExecutiveHref } from "@/lib/buyer-safe-review-navigation";
import { recordCorePilotRailChecklistStep } from "@/lib/core-pilot-rail-telemetry";
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
      className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm dark:border-teal-900 dark:bg-neutral-950"
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

            {buyerPolished === true ? (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-900"
                      aria-label="About this sample review package"
                    >
                      <Info className="h-4 w-4" aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-left">
                    Illustrative sample review — use it to understand output shape and workflow, not as customer ROI
                    evidence.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}
          </div>

          <p className="m-0 mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {buyerPolished === true ? (
              <>
                Illustrative Claims Intake package — start at the executive summary, or open the full review record to
                explore manifest, evidence trail, governance, and audit from one workspace view.
              </>
            ) : (
              "Open the Claims Intake sample to see the reviewed manifest, evidence trail, findings, and artifacts before filling out the real-input wizard."
            )}
          </p>

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
                      Start executive review
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="primary" className="h-9">
                    <Link href={sampleReviewHref} onClick={recordSampleOpened}>
                      Start with sample review
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-9">
                    <Link href="/reviews/new">Use my own input</Link>
                  </Button>
                </>
              )}
            </div>

            {buyerPolished === true ? (
              <div className="m-0 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm leading-snug text-neutral-600 dark:text-neutral-400">
                <Link
                  href={sampleReviewHref}
                  onClick={recordSampleOpened}
                  className="inline-flex min-h-[24px] items-center font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900 dark:text-teal-200 dark:hover:text-teal-100"
                >
                  Open full review package
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
