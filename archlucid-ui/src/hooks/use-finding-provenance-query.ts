"use client";

import { getFindingProvenance } from "@/lib/api/finding-provenance";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { findingProvenanceBlockedReason } from "@/lib/findings/finding-provenance-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseFindingProvenanceQueryOptions = {
  readonly enabled?: boolean;
};

export function useFindingProvenanceQuery(
  runId: string,
  findingId: string,
  options?: UseFindingProvenanceQueryOptions,
) {
  const trimmedRunId = runId.trim();
  const trimmedFindingId = findingId.trim();

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.findingProvenance(trimmedRunId, trimmedFindingId),
    queryFn: () => getFindingProvenance(trimmedRunId, trimmedFindingId),
    enabled:
      (options?.enabled ?? true) && trimmedRunId.length > 0 && trimmedFindingId.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = findingProvenanceBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
