"use client";

import { useQuery } from "@tanstack/react-query";

import { getArchitectureSealDelta } from "@/lib/api/architecture-seal-delta-api";
import { architectureSealDeltaBlockedReason } from "@/lib/architecture/architecture-seal-delta-blocked-reason";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useArchitectureSealDeltaQuery(architectureId: string, enabled = true) {
  const trimmed = architectureId.trim();

  const query = useQuery({
    queryKey: operatorQueryKeys.architectureSealDelta(trimmed),
    queryFn: () => getArchitectureSealDelta(trimmed),
    enabled: enabled && trimmed.length > 0,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = architectureSealDeltaBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
