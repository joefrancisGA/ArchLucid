"use client";

import { getRunRetrievalGrounding } from "@/lib/api";
import { runRetrievalGroundingBlockedReason } from "@/lib/runs/run-retrieval-grounding-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { RunRetrievalGroundingPayload } from "@/types/agent-forensics";

type UseRunRetrievalGroundingQueryOptions = {
  readonly enabled?: boolean;
};

export function useRunRetrievalGroundingQuery(
  runId: string,
  options?: UseRunRetrievalGroundingQueryOptions,
) {
  const trimmed = runId.trim();

  const query = createOperatorQueryHook<RunRetrievalGroundingPayload | null>({
    queryKey: operatorQueryKeys.runRetrievalGrounding(trimmed),
    queryFn: async () => getRunRetrievalGrounding(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = runRetrievalGroundingBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
