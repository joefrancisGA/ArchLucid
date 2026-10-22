"use client";



import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { RunDetailArchitectureSummaryCard } from "@/components/reviews/RunDetailArchitectureSummaryCard";

import type { ArchitectureCreationUserAssertions } from "@/lib/architecture/architecture-structured-content-types";
import { RUN_DETAIL_INCOMPLETE_OVERVIEW_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";

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

  readonly pipelineIncomplete?: boolean;

};



/** Decision-oriented overview — compact summaries; primary next step lives in the sticky CTA above. */

export function RunDetailOverviewTab(props: RunDetailOverviewTabProps): React.JSX.Element {

  if (props.pipelineIncomplete === true) {

    return (

      <div className="min-w-0 space-y-4" data-testid="run-detail-overview-tab">

        <EnterpriseCompactEmptyState {...RUN_DETAIL_INCOMPLETE_OVERVIEW_COMPACT} />

      </div>

    );

  }

  return (

    <div className="min-w-0 space-y-4" data-testid="run-detail-overview-tab">

      {props.proofStatusSlot}



      <RunDetailArchitectureSummaryCard
        key="run-detail-overview-architecture-summary"
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
