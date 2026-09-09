"use client";

import { getRealizedValueAttestation } from "@/lib/api/governance-stickiness-api-exceptions-schedules";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { realizedValueAttestationBlockedReason } from "@/lib/governance/governance-stickiness-list-blocked-reason";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

type UseRealizedValueAttestationQueryOptions = {
  readonly enabled?: boolean;
};

export function useRealizedValueAttestationQuery(options?: UseRealizedValueAttestationQueryOptions) {
  const query = createOperatorQueryHook({
    queryKey: operatorQueryKeys.governanceRealizedValueAttestation(),
    queryFn: () => getRealizedValueAttestation(),
    enabled: options?.enabled ?? true,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = realizedValueAttestationBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
