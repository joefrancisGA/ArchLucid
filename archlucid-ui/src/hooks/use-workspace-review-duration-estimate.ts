"use client";

import { useEffect, useState } from "react";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import {
  deriveWorkspaceReviewDurationEstimate,
  type WorkspaceReviewDurationEstimate,
} from "@/lib/workspace-review-duration-estimate";
import { fetchPilotRecentDeltasCached } from "@/lib/pilot-recent-deltas-client";

const RECENT_REVIEW_DURATION_SAMPLE_COUNT = 12;

export type UseWorkspaceReviewDurationEstimateResult = {
  readonly estimate: WorkspaceReviewDurationEstimate | null;
  readonly loading: boolean;
};

/**
 * Tenant-scoped p50/p90 review duration band from recent finalized reviews (TB-2149).
 */
export function useWorkspaceReviewDurationEstimate(
  enabled: boolean,
): UseWorkspaceReviewDurationEstimateResult {
  const scope = useOperatorScopeQueryKey();
  const [estimate, setEstimate] = useState<WorkspaceReviewDurationEstimate | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadEstimate(): Promise<void> {
      setLoading(true);

      try {
        const payload = await fetchPilotRecentDeltasCached(RECENT_REVIEW_DURATION_SAMPLE_COUNT, { scope });
        const next = deriveWorkspaceReviewDurationEstimate(payload);

        if (!cancelled) {
          setEstimate(next);
        }
      } catch {
        if (!cancelled) {
          setEstimate(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadEstimate();

    return () => {
      cancelled = true;
    };
  }, [enabled, scope]);

  return { estimate, loading };
}
