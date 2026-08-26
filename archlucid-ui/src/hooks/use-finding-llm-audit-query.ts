"use client";

import { getFindingLlmAudit } from "@/lib/api";
import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseFindingLlmAuditQueryOptions = {
  readonly enabled?: boolean;
};

export function useFindingLlmAuditQuery(
  runId: string,
  findingId: string,
  options?: UseFindingLlmAuditQueryOptions,
) {
  const trimmedRunId = runId.trim();
  const trimmedFindingId = findingId.trim();

  return useOperatorQueryHook({
    queryKey: operatorQueryKeys.findingLlmAudit(trimmedRunId, trimmedFindingId),
    queryFn: () => getFindingLlmAudit(trimmedRunId, trimmedFindingId),
    enabled:
      (options?.enabled ?? true) && trimmedRunId.length > 0 && trimmedFindingId.length > 0,
  });
}
