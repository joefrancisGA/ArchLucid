"use client";

import { useAssignedToMeFindingsCountQuery } from "@/hooks/use-assigned-to-me-findings-count-query";
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
      aria-label={`${count} findings assigned to you`}
      data-testid="governance-assigned-to-me-nav-badge"
    >
      {count}
    </span>
  );
}
