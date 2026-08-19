"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchOperatorTaskSuccessRates,
  type OperatorTaskSuccessRates,
} from "@/lib/fetch-operator-task-success-rates";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useOperatorTaskSuccessRatesQuery(options?: { readonly enabled?: boolean }) {
  return useQuery<OperatorTaskSuccessRates>({
    queryKey: operatorQueryKeys.operatorTaskSuccessRates,
    queryFn: fetchOperatorTaskSuccessRates,
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
