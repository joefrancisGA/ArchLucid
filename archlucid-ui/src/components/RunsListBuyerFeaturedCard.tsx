"use client";

import Link from "next/link";

import { RunStatusBadge } from "@/components/RunStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getBuyerSafeReviewsTableLink,
  getShowcaseExecutiveHref,
  getShowcaseManifestHref,
} from "@/lib/buyer-safe-review-navigation";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/buyer-surface-vocabulary";
import { SHOWCASE_STATIC_DEMO_RUN_ID, SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer-facing-review-title";
import type { RunSummary } from "@/types/authority";

const showcaseRunEnc = encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID);

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
          Decision: Approved with monitoring · Remaining risk: PHI minimization at intake boundary · Blocking issues: 0
        </p>
        <p className="m-0 mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          {counts.findingCount} findings (includes {counts.warningCount} monitored risk, non-blocking) · Evidence basis:
          signed manifest, {BUYER_SURFACE_VOCABULARY.evidenceGraphNav.toLowerCase()}, {BUYER_SURFACE_VOCABULARY.auditTrail}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="m-0 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Governance
            </dt>
            <dd className="m-0 font-medium text-neutral-900 dark:text-neutral-100">Approved with monitoring</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Monitored risk
            </dt>
            <dd className="m-0 font-medium text-neutral-900 dark:text-neutral-100">PHI minimization at intake</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800 sm:flex-row sm:flex-wrap">
        <Button type="button" variant="primary" size="sm" asChild className="sm:flex-1">
          <Link href={packageLink.href}>{packageLink.label}</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={getShowcaseExecutiveHref()}>Executive summary</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={getShowcaseManifestHref()}>Signed manifest</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={`/graph?runId=${showcaseRunEnc}`}>{BUYER_SURFACE_VOCABULARY.evidenceGraphNav}</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={`/governance?runId=${showcaseRunEnc}`}>Governance approval</Link>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href={`/audit?runId=${showcaseRunEnc}`}>{BUYER_SURFACE_VOCABULARY.auditTrail}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
