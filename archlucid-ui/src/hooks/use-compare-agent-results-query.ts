"use client";

import { compareAgentResults } from "@/lib/api/architecture-runs-compare";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { compareAgentResultsBlockedReason } from "@/lib/compare/compare-agent-results-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseCompareAgentResultsQueryOptions = {
  readonly leftRunId: string;
  readonly rightRunId: string;
  readonly enabled?: boolean;
};

export function useCompareAgentResultsQuery(options: UseCompareAgentResultsQueryOptions) {
  const leftRunId = options.leftRunId.trim();
  const rightRunId = options.rightRunId.trim();
  const enabled = (options.enabled ?? true) && leftRunId.length > 0 && rightRunId.length > 0;

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.compareAgentResults(leftRunId, rightRunId),
    queryFn: () => compareAgentResults(leftRunId, rightRunId),
    enabled,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = compareAgentResultsBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
