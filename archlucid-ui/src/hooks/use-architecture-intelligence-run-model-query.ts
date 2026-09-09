"use client";

import { fetchArchitectureIntelligenceRunModel } from "@/lib/architecture/architecture-intelligence-api-closed-loop";
import { architectureIntelligenceRunModelBlockedReason } from "@/lib/architecture/architecture-intelligence-run-model-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseArchitectureIntelligenceRunModelQueryOptions = {
  readonly enabled?: boolean;
};

export function useArchitectureIntelligenceRunModelQuery(
  runId: string,
  options?: UseArchitectureIntelligenceRunModelQueryOptions,
) {
  const trimmed = runId.trim();

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.architectureIntelligenceRunModel(trimmed),
    queryFn: () => fetchArchitectureIntelligenceRunModel(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = architectureIntelligenceRunModelBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
