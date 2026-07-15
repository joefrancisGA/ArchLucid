"use client";

import Link from "next/link";

import { RunDetailArchitectureSummaryCard } from "@/components/reviews/RunDetailArchitectureSummaryCard";
import { RunDetailRecommendedActionsPanel } from "@/app/(operator)/reviews/[runId]/_sections/RunDetailRecommendedActionsPanel";
import { Button } from "@/components/ui/button";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture-structured-content-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailWorkspaceRecommendedAction } from "@/lib/run-detail-workspace-derive";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { cn } from "@/lib/utils";

export type RunDetailOverviewTabProps = {
  readonly runId: string;
  readonly architectureTitle: string;
  readonly architectureText: string | null;
  readonly evidenceCount: number;
  readonly userAssertions: ArchitectureCreationUserAssertions | null;
  readonly recommendedActions: readonly RunDetailWorkspaceRecommendedAction[];
  readonly blockingCount: number;
  readonly governanceDecisionLabel: string;
  readonly findingCount: number;
  readonly criticalCount: number;
  readonly highCount: number;
  readonly hasManifest: boolean;
  readonly onNavigateTab: (tab: ReviewDetailTabId) => void;
  readonly proofStatusSlot: React.ReactNode;
};

function OverviewLinkCard(props: {
  readonly title: string;
  readonly body: string;
  readonly runId: string;
  readonly tab: ReviewDetailTabId;
  readonly count?: number | null;
}): React.JSX.Element {
  return (
    <article className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <h3 className={cn("m-0 text-sm font-semibold text-neutral-900 dark:text-neutral-100")}>{props.title}</h3>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>{props.body}</p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href={buildReviewDetailTabHref(props.runId, props.tab)}>
            Open
            {props.count !== null && props.count !== undefined && props.count > 0 ? ` (${props.count})` : ""}
          </Link>
        </Button>
      </div>
    </article>
  );
}

/** Decision-oriented overview — summaries with links into tabbed workspace areas. */
export function RunDetailOverviewTab(props: RunDetailOverviewTabProps): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="run-detail-overview-tab">
      {props.proofStatusSlot}

      {props.blockingCount > 0 ? (
        <div
          className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40"
          data-testid="run-detail-overview-blockers"
        >
          <p className={cn("m-0 font-medium text-amber-950 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
            {props.blockingCount} unresolved finding{props.blockingCount === 1 ? "" : "s"} currently block approval.
          </p>
        </div>
      ) : null}

      <RunDetailRecommendedActionsPanel actions={props.recommendedActions} />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-3">
          <OverviewLinkCard
            title="Findings"
            body="Review severity counts, workflow status, and material findings."
            runId={props.runId}
            tab="findings"
            count={props.findingCount}
          />
          <OverviewLinkCard
            title="Evidence"
            body="Confirm supporting evidence and traceability."
            runId={props.runId}
            tab="evidence"
            count={props.evidenceCount}
          />
          <OverviewLinkCard
            title="Decisions and remediation"
            body={`Governance decision: ${props.governanceDecisionLabel}`}
            runId={props.runId}
            tab="decisions-remediation"
          />
          <OverviewLinkCard
            title="Review package"
            body={
              props.hasManifest
                ? "Open finalized outputs, exports, and share actions."
                : "Finalize the review to create the shareable review package."
            }
            runId={props.runId}
            tab="review-package"
          />
        </div>

        <aside className="space-y-3">
          <div className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
            <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Material severity
            </p>
            <p className={cn("m-0 mt-1 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              {props.criticalCount} critical · {props.highCount} high
            </p>
          </div>
        </aside>
      </div>

      <RunDetailArchitectureSummaryCard
        architectureTitle={props.architectureTitle}
        architectureText={props.architectureText}
        evidenceCount={props.evidenceCount}
        userAssertions={props.userAssertions}
        onNavigateTab={props.onNavigateTab}
      />
    </div>
  );
}
