"use client";

import { RunDetailRecommendedActionsPanel } from "@/app/(operator)/reviews/[runId]/_sections/RunDetailRecommendedActionsPanel";
import type { RunDetailWorkspaceRecommendedAction } from "@/lib/run-detail-workspace-derive";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RunDetailOverviewTabProps = {
  readonly recommendedActions: readonly RunDetailWorkspaceRecommendedAction[];
  readonly proofStatusSlot: React.ReactNode;
  readonly bottomLineSlot: React.ReactNode;
};

/** Decision-oriented overview — next actions and proof status without duplicate shortcuts. */
export function RunDetailOverviewTab(props: RunDetailOverviewTabProps): React.JSX.Element {
  return (
    <div className="space-y-4" data-testid="run-detail-overview-tab">
      {props.proofStatusSlot}

      <RunDetailRecommendedActionsPanel actions={props.recommendedActions} />

      {props.bottomLineSlot}

      {props.recommendedActions.length === 0 && props.proofStatusSlot === null ? (
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Review the executive summary above and use the section tabs to inspect findings, evidence, and decisions.
        </p>
      ) : null}
    </div>
  );
}
