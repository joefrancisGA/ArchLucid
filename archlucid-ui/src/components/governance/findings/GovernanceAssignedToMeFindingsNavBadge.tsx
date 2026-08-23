"use client";

import { useAssignedToMeFindingsCountQuery } from "@/hooks/use-assigned-to-me-findings-count-query";
import { operatorAttentionKindLabel } from "@/lib/operator/operator-attention-taxonomy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Count badge beside Assigned to me governance nav (GOF P0-5). */
export function GovernanceAssignedToMeFindingsNavBadge() {
  const countQuery = useAssignedToMeFindingsCountQuery();
  const count = countQuery.data ?? 0;

  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-600 px-1.5 font-bold text-white",
        OPERATOR_TYPOGRAPHY.badge,
      )}
      aria-label={`${count} findings ${operatorAttentionKindLabel("assigned-to-me").toLowerCase()}`}
      data-testid="governance-assigned-to-me-nav-badge"
      data-attention-partition="assigned-to-me"
    >
      {count}
    </span>
  );
}
