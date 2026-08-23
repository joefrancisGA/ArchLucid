"use client";

import { useMemo } from "react";

import { useAlertsInboxSummaryQuery } from "@/components/alerts/use-alerts-inbox-queries";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { useOperatorShellStatusConcernFetchEnabled } from "@/components/shell/OperatorShellStatusQueryGate";
import { useAssignedToMeFindingsCountQuery } from "@/hooks/use-assigned-to-me-findings-count-query";
import { useGovernanceReviewsAwaitingActionQuery } from "@/hooks/use-governance-reviews-awaiting-action-query";
import { deriveAttentionSurfaceCounts } from "@/lib/operator/derive-attention-surface-counts";
import {
  summarizeAttentionSurfaces,
  type AttentionPartitionSummary,
  type SummarizeAttentionSurfacesInput,
} from "@/lib/operator/attention-summary";
import type { RunSummary } from "@/types/authority";

export type UseOperatorAttentionSummaryOptions = {
  readonly runs?: readonly RunSummary[];
  readonly unfinishedWorkRailCount?: number;
};

export type OperatorAttentionSummaryResult = {
  readonly surfaceCounts: SummarizeAttentionSurfacesInput;
  readonly summaries: readonly AttentionPartitionSummary[];
};

/** TB-2369 — shared client rollup for inventoried attention surfaces (no merged backend). */
export function useOperatorAttentionSummary(
  options?: UseOperatorAttentionSummaryOptions,
): OperatorAttentionSummaryResult {
  const concernFetchEnabled = useOperatorShellStatusConcernFetchEnabled();
  const { items: awaitingItems } = useGovernanceReviewsAwaitingActionQuery();
  const assignedQuery = useAssignedToMeFindingsCountQuery();
  const { summary: alertsSummary } = useAlertsInboxSummaryQuery({
    initialModel: null,
    enabled: concernFetchEnabled,
  });
  const workspaceActivity = useOperatorHomeWorkspaceActivity();

  const runs =
    options?.runs ?? workspaceActivity.liveRunsSnapshot?.items ?? undefined;

  const surfaceCounts = useMemo(
    () =>
      deriveAttentionSurfaceCounts({
        unfinishedWorkRailCount: options?.unfinishedWorkRailCount,
        runs,
        assignedToMeFindingsCount: assignedQuery.data ?? 0,
        awaitingApprovalCount: awaitingItems.length,
        alertsOpenCount: alertsSummary.open,
      }),
    [
      awaitingItems.length,
      assignedQuery.data,
      alertsSummary.open,
      options?.unfinishedWorkRailCount,
      runs,
    ],
  );

  const summaries = useMemo(() => summarizeAttentionSurfaces(surfaceCounts), [surfaceCounts]);

  return {
    surfaceCounts,
    summaries,
  };
}
