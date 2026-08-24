"use client";

import { getFindingProvenance } from "@/lib/api/finding-provenance";
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

  return createOperatorQueryHook({
    queryKey: operatorQueryKeys.findingProvenance(trimmedRunId, trimmedFindingId),
    queryFn: () => getFindingProvenance(trimmedRunId, trimmedFindingId),
    enabled:
      (options?.enabled ?? true) && trimmedRunId.length > 0 && trimmedFindingId.length > 0,
  });
}
