"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  getShowcaseExecutiveHref,
  getShowcaseManifestHref,
  getShowcaseWalkthroughHref,
} from "@/lib/buyer-safe-review-navigation";
import { recordCorePilotRailChecklistStep } from "@/lib/core-pilot-rail-telemetry";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
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
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
            {buyerPolished ? "Claims Intake sample review" : "Zero-config sample"}
          </p>
          <h2 id="sample-first-review-heading" className="m-0 mt-1 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            {buyerPolished ? "Sample architecture review package" : "Start with a completed architecture review package"}
          </h2>
          <p className="m-0 mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            {buyerPolished
              ? "Start with executive view — it is the clearest board-ready summary for this frozen sample. Manifest summary is the sealed package record; the guided walkthrough is optional narrative."
              : "Open the Claims Intake sample to see the reviewed manifest, evidence trail, findings, and artifacts before filling out the real-input wizard."}
          </p>
          {buyerPolished ? (
            <p className="m-0 mt-2 max-w-2xl text-sm font-medium leading-snug text-neutral-800 dark:text-neutral-200">
              Includes manifest outputs, PHI minimization risk with traceability, the evidence graph, an audit trail, and
              governance-ready deliverables.
            </p>
          ) : null}
          {buyerPolished ? null : (
            <p className="m-0 mt-2 text-xs text-amber-800 dark:text-amber-300">
              Illustrative sample review — use it to understand output shape, not as customer ROI evidence.
            </p>
          )}
        </div>

        <div className="shrink-0 space-y-3 lg:min-w-64">
          {buyerPolished ? (
            <p className="m-0 inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
              Illustrative sample
            </p>
          ) : (
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
                <dt className="text-[11px] text-neutral-500 dark:text-neutral-400">Warnings</dt>
                <dd className="m-0 text-lg font-semibold text-neutral-900 dark:text-neutral-50">
                  {SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount}
                </dd>
              </div>
            </dl>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {buyerPolished ? (
                <>
                  <Button asChild variant="primary" size="lg" className="h-11 min-h-[44px] px-7 text-base shadow-sm">
                    <Link href={getShowcaseExecutiveHref()} onClick={recordSampleOpened}>
                      Open executive view
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="default" className="h-9">
                    <Link href={getShowcaseManifestHref()} onClick={recordSampleOpened}>
                      Manifest summary
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
            {buyerPolished ? (
              <div className="mt-2 flex flex-col gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <Link
                    href={getShowcaseWalkthroughHref()}
                    onClick={recordSampleOpened}
                    className="text-sm text-neutral-600 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    Optional guided walkthrough
                  </Link>
                </div>
                <p className="m-0 text-xs leading-snug text-neutral-500 dark:text-neutral-500">
                  After the sample,{" "}
                  <Link href="/reviews/new" className="font-medium text-neutral-700 underline dark:text-neutral-400">
                    connect your own workspace
                  </Link>{" "}
                  — conversion path; not part of the frozen evaluation spine.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
