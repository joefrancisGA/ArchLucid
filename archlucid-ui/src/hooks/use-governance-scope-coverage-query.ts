"use client";

import { getGovernanceScopeCoverage } from "@/lib/api/governance-coverage-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { governanceScopeCoverageBlockedReason } from "@/lib/governance/governance-coverage-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseGovernanceScopeCoverageQueryOptions = {
  readonly enabled?: boolean;
};

export function useGovernanceScopeCoverageQuery(options?: UseGovernanceScopeCoverageQueryOptions) {
  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.governanceScopeCoverage(),
    queryFn: () => getGovernanceScopeCoverage(),
    enabled: options?.enabled ?? true,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = governanceScopeCoverageBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
