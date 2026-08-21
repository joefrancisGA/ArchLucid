"use client";

import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";

export type AdvisoryScheduleReviewAvailability = {
  readonly loading: boolean;
  readonly hasFinalizedReviews: boolean;
  readonly finalizedCount: number;
};

/**
 * Loads committed reviews for the advisory schedule project slug.
 * Matches {@link AdvisoryScanRunner} project scoping — not scope-wide inventory.
 */
export function useAdvisoryScheduleReviewAvailability(
  runProjectSlug: string,
): AdvisoryScheduleReviewAvailability {
  const { data, isPending } = useAskProjectRunsQuery(runProjectSlug, {
    committedOnly: true,
  });

  const finalizedCount = data?.items.length ?? 0;

  return {
    loading: isPending,
    hasFinalizedReviews: !isPending && finalizedCount > 0,
    finalizedCount,
  };
}
