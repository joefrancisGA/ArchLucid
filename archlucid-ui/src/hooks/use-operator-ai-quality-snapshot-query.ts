"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchOperatorAiQualitySnapshot,
  type OperatorAiQualitySnapshot,
} from "@/lib/operator/operator-ai-quality-snapshot";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useOperatorAiQualitySnapshotQuery(options?: { readonly enabled?: boolean }) {
  return useQuery<OperatorAiQualitySnapshot | null>({
    queryKey: operatorQueryKeys.operatorAiQualitySnapshot,
    queryFn: fetchOperatorAiQualitySnapshot,
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
