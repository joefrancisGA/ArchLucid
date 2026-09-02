"use client";

import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";
import { filterTenantOverviewRuns } from "@/lib/operator/operator-home-recent-reviews-outcome";

export type CompareFinalizedRunAvailability = {
  readonly loading: boolean;
  readonly finalizedCount: number;
  readonly insufficientForCompare: boolean;
};

/**
 * Loads committed (finalized) reviews available for compare pickers.
 * Uses the same scope-wide inventory as the Reviews hub when project is `default`
 * (create stores system name as the run project slug). Demo fallback may inject
 * showcase rows when the live list is empty.
 */
export function useCompareFinalizedRunAvailability(): CompareFinalizedRunAvailability {
  const { data, isPending } = useAskProjectRunsQuery("default", {
    forCompare: true,
    committedOnly: true,
    // Gating surfaces must not treat curated demo rows as real finalized reviews.
    mergeDemoOnEmpty: false,
  });

  const finalizedCount = filterTenantOverviewRuns(data?.items ?? []).length;

  return {
    loading: isPending,
    finalizedCount,
    insufficientForCompare: !isPending && finalizedCount < 2,
  };
}
