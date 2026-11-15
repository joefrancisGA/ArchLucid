"use client";

import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";

export type AdvisoryScheduleReviewAvailability = {
  readonly loading: boolean;
  readonly hasFinalizedReviews: boolean;
  readonly finalizedCount: number;
  readonly loadFailed: boolean;
  readonly retry: () => void;
};

/**
 * Loads committed reviews for the advisory schedule project slug.
 * Matches {@link AdvisoryScanRunner} project scoping — not scope-wide inventory.
 */
export function useAdvisoryScheduleReviewAvailability(
  runProjectSlug: string,
): AdvisoryScheduleReviewAvailability {
  const { data, isPending, isError, refetch } = useAskProjectRunsQuery(runProjectSlug, {
    committedOnly: true,
  });

  const finalizedCount = data?.items.length ?? 0;
  const loadFailed = isError || data?.loadError === true;

  return {
    loading: isPending,
    hasFinalizedReviews: !isPending && !loadFailed && finalizedCount > 0,
    finalizedCount,
    loadFailed,
    retry: () => void refetch(),
  };
}
