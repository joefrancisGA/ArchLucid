"use client";

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
        if (!cancelled) {
          setCount(response.items?.length ?? 0);
        }
      } catch {
        if (!cancelled) {
          setCount(0);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (count <= 0) {
    return null;
  }

  return (
    <span
      className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-600 px-1.5 text-[10px] font-bold text-white"
      aria-label={`${count} reviews awaiting action`}
      data-testid="governance-awaiting-action-nav-badge"
    >
      {count}
    </span>
  );
}
