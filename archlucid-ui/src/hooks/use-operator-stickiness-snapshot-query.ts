"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchOperatorStickinessSnapshot } from "@/lib/api/tenant-customer-success";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import type { OperatorStickinessSnapshotDto } from "@/types/operate-rhythm";

export function useOperatorStickinessSnapshotQuery(options?: { readonly enabled?: boolean }) {
  return useQuery<OperatorStickinessSnapshotDto>({
    queryKey: operatorQueryKeys.operatorStickinessSnapshot,
    queryFn: fetchOperatorStickinessSnapshot,
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
