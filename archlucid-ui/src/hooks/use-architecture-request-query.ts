"use client";

import { getArchitectureRequest } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { architectureRequestBlockedReason } from "@/lib/runs/architecture-request-blocked-reason";

type UseArchitectureRequestQueryOptions = {
  readonly enabled?: boolean;
};

export function useArchitectureRequestQuery(
  requestId: string,
  options?: UseArchitectureRequestQueryOptions,
) {
  const trimmed = requestId.trim();

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.architectureRequest(trimmed),
    queryFn: () => getArchitectureRequest(trimmed),
    enabled: (options?.enabled ?? true) && trimmed.length > 0,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = architectureRequestBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
