"use client";

import { operatorAttentionKindLabel } from "@/lib/operator/operator-attention-taxonomy";
import { useGovernanceReviewsAwaitingActionQuery } from "@/hooks/use-governance-reviews-awaiting-action-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** TB-263 — count badge beside governance nav when recurrence runs need commit. */
export function GovernanceReviewsAwaitingNavBadge() {
  const { items } = useGovernanceReviewsAwaitingActionQuery();
  const count = items.length;

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
