"use client";

import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";

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
  });

  const finalizedCount = data?.items.length ?? 0;

  return {
    loading: isPending,
    finalizedCount,
    insufficientForCompare: !isPending && finalizedCount < 2,
  };
}
