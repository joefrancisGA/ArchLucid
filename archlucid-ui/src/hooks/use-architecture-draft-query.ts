"use client";

import { useQuery } from "@tanstack/react-query";

import { getDraftRequest } from "@/lib/api/draft-intake-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useArchitectureDraftQuery(draftId: string, enabled = true) {
  const trimmed = draftId.trim();

  return useQuery({
    queryKey: operatorQueryKeys.architectureDraft(trimmed),
    queryFn: () => getDraftRequest(trimmed),
    enabled: enabled && trimmed.length > 0,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
