"use client";

import { useMemo } from "react";

import { useDeltaQuery } from "@/components/BeforeAfterDelta/useDeltaQuery";
import { pickPriorForSameRequest } from "@/components/BeforeAfterDelta/pick-prior-for-same-request";
import { usePriorSameRequestCompareFallbackQuery } from "@/hooks/use-prior-same-request-compare-fallback-query";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";

export type PriorSameRequestCompareHrefState = {
  readonly compareWithPriorHref: string | null;
  readonly hasSameRequestPrior: boolean;
};

/**
 * Resolves compare href for the most recent prior finalization on the same architecture request.
 * Falls back to authority run lists when the recent-deltas window omits the prior commit.
 */
export function usePriorSameRequestCompareHref(
  runId: string,
  deltaLookbackCount: number,
): PriorSameRequestCompareHrefState {
  const { status, data } = useDeltaQuery({ count: deltaLookbackCount });

  const deltaPriorRunId = useMemo(() => {
    if (status !== "ready" || data === null) {
      return null;
    }

    const current = data.items.find((row) => row.runId === runId);

    if (current === undefined) {
      return null;
    }

    const prior = pickPriorForSameRequest(current, data.items);

    return prior?.runId ?? null;
  }, [status, data, runId]);

  const fallbackQuery = usePriorSameRequestCompareFallbackQuery(runId, {
    enabled: deltaPriorRunId === null && status === "ready",
  });
  const priorRunId = deltaPriorRunId ?? fallbackQuery.data?.priorRunId ?? null;

  return {
    compareWithPriorHref:
      priorRunId !== null ? comparePageHrefAdaptive(priorRunId, runId) : null,
    hasSameRequestPrior: priorRunId !== null,
  };
}
