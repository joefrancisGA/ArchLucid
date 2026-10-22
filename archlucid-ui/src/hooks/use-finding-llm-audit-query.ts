"use client";

import { getFindingLlmAudit } from "@/lib/api";
import { findingLlmAuditBlockedReason } from "@/lib/findings/finding-llm-audit-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
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

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.findingLlmAudit(trimmedRunId, trimmedFindingId),
    queryFn: () => getFindingLlmAudit(trimmedRunId, trimmedFindingId),
    enabled:
      (options?.enabled ?? true) && trimmedRunId.length > 0 && trimmedFindingId.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = findingLlmAuditBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
