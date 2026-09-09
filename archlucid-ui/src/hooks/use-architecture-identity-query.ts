"use client";

import { useQuery } from "@tanstack/react-query";

import { getArchitectureIdentity } from "@/lib/api/architecture-identity-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { architectureIdentityBlockedReason } from "@/lib/architecture/architecture-identity-blocked-reason";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useArchitectureIdentityQuery(architectureId: string, enabled = true) {
  const trimmed = architectureId.trim();

  const query = useQuery({
    queryKey: operatorQueryKeys.architectureIdentity(trimmed),
    queryFn: () => getArchitectureIdentity(trimmed),
    enabled: enabled && trimmed.length > 0,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = architectureIdentityBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
