"use client";

import { useMemo } from "react";

import { useArchitectureIdentityQuery } from "@/hooks/use-architecture-identity-query";
import { useAskProjectRunsQuery } from "@/hooks/use-ask-project-runs-query";
import { filterTenantOverviewRuns } from "@/lib/operator/operator-home-recent-reviews-outcome";
import type { RunSummary } from "@/types/authority";

export type CompareFinalizedRunAvailability = {
  readonly loading: boolean;
  readonly finalizedCount: number;
  readonly insufficientForCompare: boolean;
  readonly finalizedRuns: readonly RunSummary[];
};

export type UseCompareFinalizedRunAvailabilityOptions = {
  readonly architectureId?: string;
};

/**
 * Loads committed (finalized) reviews available for compare pickers.
 * Uses the same scope-wide inventory as the Reviews hub when project is `default`
 * (create stores system name as the run project slug). Demo fallback may inject
 * showcase rows when the live list is empty.
 */
export function useCompareFinalizedRunAvailability(
  options?: UseCompareFinalizedRunAvailabilityOptions,
): CompareFinalizedRunAvailability {
  const architectureId = options?.architectureId?.trim() ?? "";
  const architectureQuery = useArchitectureIdentityQuery(architectureId, architectureId.length > 0);
  const { data, isPending } = useAskProjectRunsQuery("default", {
    forCompare: true,
    committedOnly: true,
    // Gating surfaces must not treat curated demo rows as real finalized reviews.
    mergeDemoOnEmpty: false,
  });

  const scopedRunIds = useMemo(() => {
    if (architectureId.length === 0 || architectureQuery.data === undefined) {
      return null;
    }

    return new Set(architectureQuery.data.reviews.map((review) => review.runId));
  }, [architectureId.length, architectureQuery.data]);

  const finalizedRuns = useMemo(() => {
    const overviewRuns = filterTenantOverviewRuns(data?.items ?? []);

    if (scopedRunIds === null) {
      return overviewRuns;
    }

    return overviewRuns.filter((run) => scopedRunIds.has(run.runId));
  }, [data?.items, scopedRunIds]);

  const loading = isPending || (architectureId.length > 0 && architectureQuery.isLoading);
  const finalizedCount = finalizedRuns.length;

  return {
    loading,
    finalizedCount,
    insufficientForCompare: !loading && finalizedCount < 2,
    finalizedRuns,
  };
}
