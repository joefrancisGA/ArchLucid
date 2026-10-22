"use client";

import { useQuery } from "@tanstack/react-query";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import {
  fetchOperatorNextBestActions,
  type OperatorNextBestActionDto,
} from "@/lib/api/tenant-customer-success";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useOperatorNextBestActionsQuery(options?: { readonly enabled?: boolean }) {
  const scope = useOperatorScopeQueryKey();

  return useQuery<OperatorNextBestActionDto[]>({
    queryKey: operatorQueryKeys.operatorNextBestActions(scope),
    queryFn: fetchOperatorNextBestActions,
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
