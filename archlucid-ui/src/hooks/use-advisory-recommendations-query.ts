"use client";

import { useQuery } from "@tanstack/react-query";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { listRecommendations } from "@/lib/advisory-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useAdvisoryRecommendationsQuery(
  runId: string,
  options?: { readonly enabled?: boolean },
) {
  const scope = useOperatorScopeQueryKey();
  const trimmedRunId = runId.trim();

  return useQuery({
    queryKey: operatorQueryKeys.advisoryRecommendations(scope, trimmedRunId),
    queryFn: () => listRecommendations(trimmedRunId),
    enabled: trimmedRunId.length > 0 && (options?.enabled ?? true),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
