"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useEffect, useState } from "react";

import { getGovernanceReviewsAwaitingAction } from "@/lib/api/governance-stickiness-api";

/** TB-263 — count badge beside governance nav when recurrence runs need commit. */
export function GovernanceReviewsAwaitingNavBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await getGovernanceReviewsAwaitingAction();
        if (!canceled) {
          setCount(response.items?.length ?? 0);
        }
      } catch {
        if (!canceled) {
          setCount(0);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={cn("ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-600 px-1.5 font-bold text-white", OPERATOR_TYPOGRAPHY.badge)}
      aria-label={`${count} reviews awaiting action`}
      data-testid="governance-awaiting-action-nav-badge"
    >
      {count}
    </span>
  );
}
