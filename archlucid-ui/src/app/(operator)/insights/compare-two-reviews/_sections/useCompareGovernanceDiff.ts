"use client";

import { useMemo } from "react";

import { useCompareGovernanceDiffQuery } from "@/hooks/use-compare-governance-diff-query";
import type { CompareGovernanceDiffView } from "@/lib/compare-effective-governance-diff";

export type CompareGovernanceDiffLoadState = {
  readonly loading: boolean;
  readonly view: CompareGovernanceDiffView | null;
  readonly softFailureMessage: string | null;
};

/**
 * Loads governance diff inputs for a compared pair. Failures are soft — compare results still render.
 */
export function useCompareGovernanceDiff(
  baselineRunId: string | null,
  targetRunId: string | null,
): CompareGovernanceDiffLoadState {
  const diffQuery = useCompareGovernanceDiffQuery(baselineRunId, targetRunId);

  return useMemo(
    () => ({
      loading: diffQuery.isPending,
      view: diffQuery.data?.view ?? null,
      softFailureMessage: diffQuery.data?.softFailureMessage ?? null,
    }),
    [diffQuery.data, diffQuery.isPending],
  );
}
