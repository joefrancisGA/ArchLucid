"use client";

import { useQuery } from "@tanstack/react-query";

import { getDraftRequest } from "@/lib/api/draft-intake-api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { architectureDraftBlockedReason } from "@/lib/architecture/architecture-draft-blocked-reason";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useArchitectureDraftQuery(draftId: string, enabled = true) {
  const trimmed = draftId.trim();

  const query = useQuery({
    queryKey: operatorQueryKeys.architectureDraft(trimmed),
    queryFn: () => getDraftRequest(trimmed),
    enabled: enabled && trimmed.length > 0,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });

  const failure: ApiLoadFailureState | null = query.isError ? toApiLoadFailure(query.error) : null;
  const blockedReason = architectureDraftBlockedReason(failure);

  return {
    ...query,
    failure,
    blockedReason,
  };
}
