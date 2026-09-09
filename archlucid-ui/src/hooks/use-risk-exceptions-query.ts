"use client";

import { listRiskExceptions } from "@/lib/api/governance-stickiness-api-exceptions-schedules";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { riskExceptionsBlockedReason } from "@/lib/governance/governance-stickiness-list-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseRiskExceptionsQueryOptions = {
  readonly enabled?: boolean;
  readonly projectId?: string;
};

export function useRiskExceptionsQuery(options?: UseRiskExceptionsQueryOptions) {
  const projectId = options?.projectId?.trim() ?? "";

  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.governanceRiskExceptions(projectId),
    queryFn: () => listRiskExceptions(projectId.length > 0 ? projectId : undefined),
    enabled: options?.enabled ?? true,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = riskExceptionsBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
