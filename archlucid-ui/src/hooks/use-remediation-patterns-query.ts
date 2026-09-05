"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchRemediationPatternDetail,
  fetchRemediationPatterns,
} from "@/lib/remediation-pattern-api";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export const remediationPatternsQueryKeys = {
  list: ["remediation-patterns", "list"] as const,
  detail: (patternId: string) => ["remediation-patterns", "detail", patternId] as const,
};

export function useRemediationPatternsQuery() {
  return useQuery({
    queryKey: remediationPatternsQueryKeys.list,
    queryFn: fetchRemediationPatterns,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}

export function useRemediationPatternDetailQuery(patternId: string | null) {
  return useQuery({
    queryKey: patternId ? remediationPatternsQueryKeys.detail(patternId) : ["remediation-patterns", "detail", "none"],
    queryFn: () => fetchRemediationPatternDetail(patternId!),
    enabled: patternId !== null,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
