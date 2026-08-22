"use client";
import { cn } from "@/lib/utils";
import { CTA_WIDTH, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";

import { RunStatusBadge } from "@/components/runs/RunStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { buyerDemoPackageCardMeta } from "@/lib/buyer/buyer-demo-package-card-meta";
import { getBuyerSafeReviewsTableLink } from "@/lib/buyer/buyer-safe-review-navigation";
import { BUYER_SURFACE_VOCABULARY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { SHOWCASE_STATIC_DEMO_SPINE_COUNTS } from "@/lib/showcase-static-demo";
import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import { canonicalizeDemoRunId, isShowcaseStaticDemoRunId } from "@/lib/demo-run-canonical";
import type { RunSummary } from "@/types/authority";

export type RunsListBuyerFeaturedCardProps = {
  readonly run: RunSummary;
};

function defaultDecisionSummary(run: RunSummary): string {
  if (run.hasGoldenManifest === true) {
    return "Finalized review";
  }

  if (run.hasFindingsSnapshot === true) {
    return "In progress — findings recorded, manifest not finalized";
  }

  return "In progress — review pipeline active";
}

/**
 * Buyer demo: one review as a proof card instead of a sparse table row.
 */
export function RunsListBuyerFeaturedCard({ run }: RunsListBuyerFeaturedCardProps) {
  const title = buyerFacingReviewTitleFromSummary(run);
  const packageLink = getBuyerSafeReviewsTableLink(run.runId);
  const meta = buyerDemoPackageCardMeta(run.runId);
  const showcaseCounts = isShowcaseStaticDemoRunId(canonicalizeDemoRunId(run.runId))
    ? SHOWCASE_STATIC_DEMO_SPINE_COUNTS
    : null;

  return (
    <div data-testid={`runs-row-${run.runId}`}>
      <Card
        className="border border-teal-600/50 shadow-sm dark:border-teal-500/40"
        data-testid="runs-list-buyer-featured-card"
      >
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="m-0 text-lg">{title}</CardTitle>
            <RunStatusBadge run={run} />
          </div>
          <p className={cn("m-0 mt-2 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
            {meta?.decisionSummary ?? defaultDecisionSummary(run)}
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <dl className={cn("m-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-3", OPERATOR_TYPOGRAPHY.body)}>
            <div>
              <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Decision date
              </dt>
              <dd className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                {meta?.decisionDate ?? new Date(run.createdUtc).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Review owner
              </dt>
              <dd className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                {meta?.packageOwner ?? " — "}
              </dd>
            </div>
            <div>
              <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Risk owner
              </dt>
              <dd className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                {meta?.riskOwner ?? " — "}
              </dd>
            </div>
            <div>
              <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Approval authority
              </dt>
              <dd className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                {meta?.approvalAuthority ?? " — "}
              </dd>
            </div>
            <div>
              <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Last audit event
              </dt>
              <dd className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                {meta?.lastAuditEvent ?? " — "}
              </dd>
            </div>
            <div>
              <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {BUYER_SURFACE_VOCABULARY.auditTrail}
              </dt>
              <dd className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                {run.hasGoldenManifest === true ? "Complete" : "In progress"}
              </dd>
            </div>
            {showcaseCounts !== null ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className={cn("font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  Findings summary
                </dt>
                <dd className="m-0 font-medium text-neutral-900 dark:text-neutral-100">
                  {showcaseCounts.findingCount} findings (includes {showcaseCounts.warningCount} monitored risk,
                  non-blocking)
                </dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
        <CardFooter className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="primary" size="sm" asChild className={CTA_WIDTH.content}>
            <Link href={packageLink.href} data-testid={`runs-row-primary-explore-${run.runId}`}>
              {packageLink.label}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
