"use client";

import { useQueries } from "@tanstack/react-query";

import { fetchRunDetailCriticalPageBundle } from "@/lib/fetch-run-detail-page-bundle-client";
import {
  buildCompareRoiHeadlineDeltaView,
  type CompareRoiHeadlineDeltaView,
} from "@/lib/review-quality/compare-roi-headline-delta";
import { resolveRunSavingsSummaryFromRunDetail } from "@/lib/runs/run-savings-summary-from-detail";

async function loadCompareRunSavings(runId: string) {
  const bundle = await fetchRunDetailCriticalPageBundle(runId);

  return resolveRunSavingsSummaryFromRunDetail(bundle.data.buyerSummary);
}

export function useCompareRoiHeadlineDelta(input: {
  readonly baselineRunId: string | null;
  readonly targetRunId: string | null;
}): {
  readonly loading: boolean;
  readonly view: CompareRoiHeadlineDeltaView | null;
} {
  const baselineRunId = input.baselineRunId?.trim() ?? "";
  const targetRunId = input.targetRunId?.trim() ?? "";
  const enabled = baselineRunId.length > 0 && targetRunId.length > 0;

  const queries = useQueries({
    queries: [
      {
        queryKey: ["operator", "compare", "roi-headline", baselineRunId] as const,
        queryFn: () => loadCompareRunSavings(baselineRunId),
        enabled,
      },
      {
        queryKey: ["operator", "compare", "roi-headline", targetRunId] as const,
        queryFn: () => loadCompareRunSavings(targetRunId),
        enabled,
      },
    ],
  });

  if (!enabled) {
    return { loading: false, view: null };
  }

  const loading = queries.some((query) => query.isPending);

  if (loading || queries.some((query) => query.isError)) {
    return { loading, view: null };
  }

  return {
    loading: false,
    view: buildCompareRoiHeadlineDeltaView({
      baselineSavings: queries[0]?.data ?? null,
      targetSavings: queries[1]?.data ?? null,
    }),
  };
}
