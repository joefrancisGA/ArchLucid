"use client";

import { getRunExplanationSummary } from "@/lib/api";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { RunExplanationSummary } from "@/types/explanation";

type UsePinnedReviewExplanationQueryOptions = {
  readonly enabled?: boolean;
};

export function usePinnedReviewExplanationQuery(
  runId: string,
  options?: UsePinnedReviewExplanationQueryOptions,
) {
  const trimmed = runId.trim();

  return createOperatorQueryHook<RunExplanationSummary>({
    queryKey: [...operatorQueryKeys.runSummary(trimmed), "pin-explanation"] as const,
    queryFn: () => getRunExplanationSummary(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
    staleTime: 60_000,
  });
}
