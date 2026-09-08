"use client";

import { operatorAttentionKindLabel } from "@/lib/operator/operator-attention-taxonomy";
import { useOperatorAttentionSummary } from "@/hooks/use-operator-attention-summary";
import { useGovernanceReviewsAwaitingActionQuery } from "@/hooks/use-governance-reviews-awaiting-action-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** TB-263 — count badge beside governance nav when recurrence runs need commit. */
export function GovernanceReviewsAwaitingNavBadge() {
  const { summaries } = useOperatorAttentionSummary();
  const { items } = useGovernanceReviewsAwaitingActionQuery();
    const summaryCount =
      summaries.find((summary) => summary.partition === "awaiting-approval")?.totalCount;
    const count = summaryCount !== undefined && summaryCount > 0 ? summaryCount : items.length;

  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-600 px-1.5 font-bold text-white",
        OPERATOR_TYPOGRAPHY.badge,
      )}
      aria-label={`${count} reviews ${operatorAttentionKindLabel("awaiting-approval").toLowerCase()}`}
      data-testid="governance-awaiting-action-nav-badge"
      data-attention-partition="awaiting-approval"
    >
      {count}
    </span>
  );
}
