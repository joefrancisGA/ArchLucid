"use client";

import { useMemo } from "react";

import { usePilotRecentDeltasQuery } from "@/hooks/use-pilot-recent-deltas-query";
import {
  deriveWorkspaceReviewDurationEstimate,
  type WorkspaceReviewDurationEstimate,
} from "@/lib/workspace-review-duration-estimate";

const RECENT_REVIEW_DURATION_SAMPLE_COUNT = 12;

export type UseWorkspaceReviewDurationEstimateResult = {
  readonly estimate: WorkspaceReviewDurationEstimate | null;
  readonly loading: boolean;
};

/**
 * Tenant-scoped p50/p90 review duration band from recent finalized reviews (TB-2149).
 *
 * Reads through the shared recent-deltas query, so surfaces that show the band together issue one
 * request and refresh together when the cache is invalidated.
 */
export function useWorkspaceReviewDurationEstimate(
  enabled: boolean,
): UseWorkspaceReviewDurationEstimateResult {
  const { data, isPending, isError } = usePilotRecentDeltasQuery(
    RECENT_REVIEW_DURATION_SAMPLE_COUNT,
    { enabled },
  );

  const estimate = useMemo<WorkspaceReviewDurationEstimate | null>(() => {
    if (isError) {
      return null;
    }

    return deriveWorkspaceReviewDurationEstimate(data);
  }, [data, isError]);

  // A disabled query stays pending forever, so gate on `enabled` to keep reporting idle as loaded.
  return { estimate, loading: enabled && isPending };
}
