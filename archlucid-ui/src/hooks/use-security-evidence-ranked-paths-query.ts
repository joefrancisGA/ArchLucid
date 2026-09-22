"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchRankedSecurityEvidencePaths } from "@/lib/security-evidence-path-api";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";

export const securityEvidenceRankedPathsQueryKeys = {
  ranked: (scopeKey: OperatorScopeQueryKey, page: number, pageSize: number) =>
    ["security-evidence-path", "ranked", scopeKey, page, pageSize] as const,
};

export function useSecurityEvidenceRankedPathsQuery(page = 1, pageSize = 25) {
  const scopeKey = useOperatorScopeQueryKey();

  return useQuery({
    queryKey: securityEvidenceRankedPathsQueryKeys.ranked(scopeKey, page, pageSize),
    queryFn: () => fetchRankedSecurityEvidencePaths(page, pageSize),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
