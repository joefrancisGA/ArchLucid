"use client";

import { useEffect, useMemo, useState } from "react";

import { pickPriorForSameRequest } from "@/components/BeforeAfterDelta/pick-prior-for-same-request";
import { pickPriorForSameRequestFromRunSummaries } from "@/components/BeforeAfterDelta/pick-prior-from-run-summaries";
import { useDeltaQuery } from "@/components/BeforeAfterDelta/useDeltaQuery";
import {
  getRunSummary,
  listRunsByProjectPaged,
  listRunsInScopePaged,
  shouldListReviewsAcrossProjectSlugs,
} from "@/lib/api/architecture-runs";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";

/** Aligns with run-detail workspace lookback when recent-deltas max is 25. */
const RUN_LIST_FALLBACK_TAKE = 60;

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
  const [fallbackPriorRunId, setFallbackPriorRunId] = useState<string | null>(null);

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

  useEffect(() => {
    if (deltaPriorRunId !== null) {
      setFallbackPriorRunId(null);
      return;
    }

    if (status !== "ready") {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const summary = await getRunSummary(runId);
        const projectId = summary.projectId?.trim() ?? "default";
        const listPage = shouldListReviewsAcrossProjectSlugs(projectId)
          ? await listRunsInScopePaged(1, RUN_LIST_FALLBACK_TAKE)
          : await listRunsByProjectPaged(projectId, 1, RUN_LIST_FALLBACK_TAKE);

        if (cancelled) {
          return;
        }

        const prior = pickPriorForSameRequestFromRunSummaries(summary, listPage.items);
        setFallbackPriorRunId(prior?.runId ?? null);
      } catch {
        if (!cancelled) {
          setFallbackPriorRunId(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [deltaPriorRunId, status, runId]);

  const priorRunId = deltaPriorRunId ?? fallbackPriorRunId;

  return {
    compareWithPriorHref:
      priorRunId !== null ? comparePageHrefAdaptive(priorRunId, runId) : null,
    hasSameRequestPrior: priorRunId !== null,
  };
}
