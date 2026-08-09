"use client";

import { RunDetailArchitectureSummaryCard } from "@/components/reviews/RunDetailArchitectureSummaryCard";
import { RunDetailRecommendedActionsPanel } from "@/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailRecommendedActionsPanel";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture-structured-content-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { RunDetailWorkspaceRecommendedAction } from "@/lib/run-detail-workspace-derive";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import { cn } from "@/lib/utils";

export type RunDetailOverviewTabProps = {
  readonly runId: string;
  readonly architectureTitle: string | null;
  readonly architectureText: string | null;
  readonly evidenceCount: number;
  readonly hasSubmittedArchitecture: boolean;
  readonly userAssertions: ArchitectureCreationUserAssertions | null;
  readonly recommendedActions: readonly RunDetailWorkspaceRecommendedAction[];
  readonly criticalCount: number;
  readonly highCount: number;
  readonly onNavigateTab: (tab: ReviewDetailTabId) => void;
  readonly proofStatusSlot: React.ReactNode;
};

/** Decision-oriented overview — actions and summaries; tab bar covers deep navigation. */
export function RunDetailOverviewTab(props: RunDetailOverviewTabProps): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="run-detail-overview-tab">
      {props.proofStatusSlot}

      <RunDetailRecommendedActionsPanel actions={props.recommendedActions} />

      <div className="rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
        <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Material severity
        </p>
        <p className={cn("m-0 mt-1 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          {props.criticalCount} critical · {props.highCount} high
        </p>
      </div>

      <RunDetailArchitectureSummaryCard
        architectureTitle={props.architectureTitle}
        architectureText={props.architectureText}
        evidenceCount={props.evidenceCount}
        userAssertions={props.userAssertions}
        hasSubmittedArchitecture={props.hasSubmittedArchitecture}
        onNavigateTab={props.onNavigateTab}
      />
    </div>
  );
}
