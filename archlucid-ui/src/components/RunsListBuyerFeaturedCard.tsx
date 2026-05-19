"use client";

import Link from "next/link";

import { RunStatusBadge } from "@/components/RunStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getBuyerSafeReviewsTableLink } from "@/lib/buyer-safe-review-navigation";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import type { RunSummary } from "@/types/authority";

export type RunsListBuyerFeaturedCardProps = {
  readonly run: RunSummary;
};

/**
 * Buyer demo: one finalized review as a proof card instead of a single-row table.
 */
export function RunsListBuyerFeaturedCard({ run }: RunsListBuyerFeaturedCardProps) {
  const title = buyerFacingReviewTitleFromSummary(run);
  const packageLink = getBuyerSafeReviewsTableLink(run.runId);
  const counts = SHOWCASE_STATIC_DEMO_SPINE_COUNTS;

  return (
    <div data-testid={`runs-row-${run.runId}`}>
      <Card
        className="border-2 border-teal-600/80 shadow-md dark:border-teal-500/70"
        data-testid="runs-list-buyer-featured-card"
      >
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="m-0 text-lg">{title}</CardTitle>
            <RunStatusBadge run={run} />
          </div>
          <p className="m-0 mt-2 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
            Decision: Approved with monitoring · Remaining monitored risk: 1 · Blocking issues: 0
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="m-0 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Evidence trail
              </dt>
              <dd className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Ready</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {BUYER_SURFACE_VOCABULARY.auditTrail}
              </dt>
              <dd className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Complete</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Findings summary
              </dt>
              <dd className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                {counts.findingCount} findings (includes {counts.warningCount} monitored risk, non-blocking)
              </dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="primary" size="sm" asChild className="w-full sm:w-auto">
            <Link href={packageLink.href} data-testid={`runs-row-primary-explore-${run.runId}`}>
              {packageLink.label}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
