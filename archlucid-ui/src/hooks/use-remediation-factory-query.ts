"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchRemediationFactoryMetrics,
  fetchRemediationRankedFindings,
} from "@/lib/remediation-factory-api";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export const remediationFactoryQueryKeys = {
  ranked: ["remediation-factory", "ranked"] as const,
  metrics: ["remediation-factory", "metrics"] as const,
};

export function useRemediationRankedFindingsQuery() {
  return useQuery({
    queryKey: remediationFactoryQueryKeys.ranked,
    queryFn: fetchRemediationRankedFindings,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}

export function useRemediationFactoryMetricsQuery() {
  return useQuery({
    queryKey: remediationFactoryQueryKeys.metrics,
    queryFn: fetchRemediationFactoryMetrics,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
