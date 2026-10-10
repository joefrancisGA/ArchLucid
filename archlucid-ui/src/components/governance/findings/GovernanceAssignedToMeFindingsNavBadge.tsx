"use client";

import { useAssignedToMeFindingsCountQuery } from "@/hooks/use-assigned-to-me-findings-count-query";
import { GovernanceAssignedToMeCountBlockedCallout } from "@/components/governance/findings/GovernanceAssignedToMeCountBlockedCallout";
import { operatorAttentionKindLabel } from "@/lib/operator/operator-attention-taxonomy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Count badge beside Assigned to me governance nav (GOF P0-5). */
export function GovernanceAssignedToMeFindingsNavBadge() {
  const countQuery = useAssignedToMeFindingsCountQuery();

  if (countQuery.blockedReason !== null || countQuery.failure !== null) {
    return <GovernanceAssignedToMeCountBlockedCallout failure={countQuery.failure} />;
  }

  if (countQuery.isPending || typeof countQuery.data !== "number") {
    return null;
  }

  const count = countQuery.data;

  if (count === null || count <= 0) {
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
