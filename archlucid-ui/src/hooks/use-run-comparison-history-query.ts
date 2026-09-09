"use client";

import { getRunComparisonHistory } from "@/lib/api/run-comparison-history-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { runComparisonHistoryBlockedReason } from "@/lib/compare/run-comparison-history-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseRunComparisonHistoryQueryOptions = {
  readonly enabled?: boolean;
};

export function useRunComparisonHistoryQuery(runId: string, options?: UseRunComparisonHistoryQueryOptions) {
  const trimmed = runId.trim();

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.runComparisonHistory(trimmed),
    queryFn: () => getRunComparisonHistory(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = runComparisonHistoryBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
