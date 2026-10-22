import { buyerFacingReviewTitleFromSummary } from "@/lib/buyer/buyer-facing-review-title";
import type { GovernanceReviewAwaitingActionItem } from "@/lib/api/governance-stickiness-api";
import type { OperatorAttentionKindId } from "@/lib/operator/operator-attention-taxonomy";
import type { UnfinishedWorkRailItem } from "@/lib/unfinished-work-rail";
import type { AlertRecord } from "@/types/alerts";
import type { RunSummary } from "@/types/authority";

export type ResolveAttentionPartitionPreviewInput = {
  readonly partition: OperatorAttentionKindId;
  readonly topUnfinishedItem: UnfinishedWorkRailItem | null;
  readonly assignedFindingTitle: string | null;
  readonly topAwaitingApproval: GovernanceReviewAwaitingActionItem | null;
  readonly topAlert: AlertRecord | null;
  readonly runs: readonly RunSummary[];
};

function resolveUnfinishedWorkPreview(input: ResolveAttentionPartitionPreviewInput): string | null {
  if (input.topUnfinishedItem !== null) {
    return input.topUnfinishedItem.title;
  }

  const run = input.runs.find((row) => row.isArchived !== true);

  if (run === undefined) {
    return null;
  }

  return buyerFacingReviewTitleFromSummary(run);
}

/** One-line preview for needs-attention inbox partition cards (wave 3). */
export function resolveAttentionPartitionPreview(
  input: ResolveAttentionPartitionPreviewInput,
): string | null {
  switch (input.partition) {
    case "unfinished-work":
      return resolveUnfinishedWorkPreview(input);

    case "assigned-to-me":
      return input.assignedFindingTitle;

    case "awaiting-approval":
      return input.topAwaitingApproval?.name?.trim() ?? input.topAwaitingApproval?.runId ?? null;

    case "alerts":
      return input.topAlert?.title?.trim() ?? input.topAlert?.alertId ?? null;

    default: {
      const unreachable: never = input.partition;

      return unreachable;
    }
  }
}
