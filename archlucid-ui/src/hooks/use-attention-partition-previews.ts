"use client";

import { useMemo } from "react";

import { useAlertsInboxPageQuery } from "@/components/alerts/use-alerts-inbox-queries";
import { useOperatorHomeWorkspaceActivity } from "@/components/operator-home/operator-home-workspace-activity-context";
import { useArchitectureDraftRegistryEntries } from "@/hooks/use-architecture-draft-registry-entries";
import { useGovernanceReviewsAwaitingActionQuery } from "@/hooks/use-governance-reviews-awaiting-action-query";
import { useOperatorAttentionSummary } from "@/hooks/use-operator-attention-summary";
import { resolveAttentionPartitionPreview } from "@/lib/operator/resolve-attention-partition-preview";
import type { OperatorAttentionKindId } from "@/lib/operator/operator-attention-taxonomy";
import {
  listIncompleteWizardSignals,
  summarizeUnfinishedWorkRailItems,
} from "@/lib/unfinished-work-rail";

/** Preview lines for needs-attention inbox partition cards. */
export function useAttentionPartitionPreviews(): Readonly<Record<OperatorAttentionKindId, string | null>> {
  const drafts = useArchitectureDraftRegistryEntries();
  const { liveRunsSnapshot } = useOperatorHomeWorkspaceActivity();
  const runs = liveRunsSnapshot?.items ?? [];
  const incompleteWizards = listIncompleteWizardSignals();
  const { summaries } = useOperatorAttentionSummary({ runs });
  const { items: awaitingItems } = useGovernanceReviewsAwaitingActionQuery();
  const alertsQuery = useAlertsInboxPageQuery({
    status: "Open",
    cursor: "",
    initialModel: null,
  });

  const topUnfinishedItem = useMemo(
    () =>
      summarizeUnfinishedWorkRailItems({
        drafts,
        runs,
        incompleteWizards,
        maxItems: 1,
      }).items[0] ?? null,
    [drafts, incompleteWizards, runs],
  );

  const assignedSummary = summaries.find((summary) => summary.partition === "assigned-to-me");
  const assignedFindingTitle =
    assignedSummary !== undefined && assignedSummary.totalCount > 0
      ? `${assignedSummary.totalCount} finding${assignedSummary.totalCount === 1 ? "" : "s"} assigned to you`
      : null;

  const topAlert = alertsQuery.items[0] ?? null;

  return useMemo(
    () => ({
      "unfinished-work": resolveAttentionPartitionPreview({
        partition: "unfinished-work",
        topUnfinishedItem,
        assignedFindingTitle: null,
        topAwaitingApproval: null,
        topAlert: null,
        runs,
      }),
      "assigned-to-me": resolveAttentionPartitionPreview({
        partition: "assigned-to-me",
        topUnfinishedItem: null,
        assignedFindingTitle,
        topAwaitingApproval: null,
        topAlert: null,
        runs,
      }),
      alerts: resolveAttentionPartitionPreview({
        partition: "alerts",
        topUnfinishedItem: null,
        assignedFindingTitle: null,
        topAwaitingApproval: null,
        topAlert,
        runs,
      }),
      "awaiting-approval": resolveAttentionPartitionPreview({
        partition: "awaiting-approval",
        topUnfinishedItem: null,
        assignedFindingTitle: null,
        topAwaitingApproval: awaitingItems[0] ?? null,
        topAlert: null,
        runs,
      }),
    }),
    [assignedFindingTitle, awaitingItems, runs, topAlert, topUnfinishedItem],
  );
}
