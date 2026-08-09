"use client";

import { RunDetailArchitectureSummaryCard } from "@/components/reviews/RunDetailArchitectureSummaryCard";
import { RunDetailRecommendedActionsPanel } from "@/app/(operator)/architecture/reviews/[runId]/_sections/RunDetailRecommendedActionsPanel";
import type { ArchitectureCreationUserAssertions } from "@/lib/architecture-structured-content-types";
import type { RunDetailWorkspaceRecommendedAction } from "@/lib/run-detail-workspace-derive";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";

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
    <div className="min-w-0 space-y-4" data-testid="run-detail-overview-tab">
      {props.proofStatusSlot}

      <RunDetailRecommendedActionsPanel actions={props.recommendedActions} />

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
