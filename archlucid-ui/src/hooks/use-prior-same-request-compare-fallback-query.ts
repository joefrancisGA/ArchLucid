"use client";

import { pickPriorForSameRequestFromRunSummaries } from "@/components/BeforeAfterDelta/pick-prior-from-run-summaries";
import {
  getRunSummary,
  listRunsByProjectPaged,
  listRunsInScopePaged,
  shouldListReviewsAcrossProjectSlugs,
} from "@/lib/api/architecture-runs";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

/** Aligns with run-detail workspace lookback when recent-deltas max is 25. */
const RUN_LIST_FALLBACK_TAKE = 60;

export type PriorSameRequestCompareFallbackResult = {
  readonly priorRunId: string | null;
};

async function fetchPriorSameRequestCompareFallback(
  runId: string,
): Promise<PriorSameRequestCompareFallbackResult> {
  const summary = await getRunSummary(runId);
  const projectId = summary.projectId?.trim() ?? "default";
  const listPage = shouldListReviewsAcrossProjectSlugs(projectId)
    ? await listRunsInScopePaged(1, RUN_LIST_FALLBACK_TAKE)
    : await listRunsByProjectPaged(projectId, 1, RUN_LIST_FALLBACK_TAKE);
  const prior = pickPriorForSameRequestFromRunSummaries(summary, listPage.items);

  return {
    priorRunId: prior?.runId ?? null,
  };
}

type UsePriorSameRequestCompareFallbackQueryOptions = {
  readonly enabled?: boolean;
};

export function usePriorSameRequestCompareFallbackQuery(
  runId: string,
  options?: UsePriorSameRequestCompareFallbackQueryOptions,
) {
  const trimmed = runId.trim();

  return createOperatorQueryHook<PriorSameRequestCompareFallbackResult>({
    queryKey: operatorQueryKeys.priorSameRequestCompareFallback(trimmed),
    queryFn: () => fetchPriorSameRequestCompareFallback(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });
}
