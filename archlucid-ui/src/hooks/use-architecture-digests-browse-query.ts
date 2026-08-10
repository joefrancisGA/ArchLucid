"use client";

import { useQuery } from "@tanstack/react-query";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { listArchitectureDigests } from "@/lib/api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useArchitectureDigestsBrowseQuery(take = 40) {
  const scope = useOperatorScopeQueryKey();

  return useQuery({
    queryKey: operatorQueryKeys.architectureDigestsBrowse(scope, take),
    queryFn: () => listArchitectureDigests(take),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
