"use client";

import { useQuery } from "@tanstack/react-query";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { listDigestSubscriptions } from "@/lib/api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useDigestSubscriptionsQuery() {
  const scope = useOperatorScopeQueryKey();

  return useQuery({
    queryKey: operatorQueryKeys.digestSubscriptions(scope),
    queryFn: () => listDigestSubscriptions(),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
