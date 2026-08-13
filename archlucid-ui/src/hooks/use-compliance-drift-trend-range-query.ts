"use client";

import { useQuery } from "@tanstack/react-query";

import { getComplianceDriftTrend } from "@/lib/api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

type UseComplianceDriftTrendRangeQueryOptions = {
  readonly enabled?: boolean;
};

export function useComplianceDriftTrendRangeQuery(
  fromUtc: string,
  toUtc: string,
  options?: UseComplianceDriftTrendRangeQueryOptions,
) {
  return useQuery<ComplianceDriftTrendPoint[]>({
    queryKey: operatorQueryKeys.complianceDriftTrendRange(fromUtc, toUtc),
    queryFn: () => getComplianceDriftTrend(fromUtc, toUtc, 1440),
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
