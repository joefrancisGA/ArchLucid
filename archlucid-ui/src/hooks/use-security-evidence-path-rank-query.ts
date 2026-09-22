"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchSecurityEvidencePathRank } from "@/lib/security-evidence-path-api";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";

export const securityEvidencePathRankQueryKeys = {
  rank: (scopeKey: OperatorScopeQueryKey, pathId: string | null) =>
    ["security-evidence-path", "rank", scopeKey, pathId] as const,
};

export function useSecurityEvidencePathRankQuery(pathId: string | null) {
  const scopeKey = useOperatorScopeQueryKey();

  return useQuery({
    queryKey: securityEvidencePathRankQueryKeys.rank(scopeKey, pathId),
    queryFn: () => fetchSecurityEvidencePathRank(pathId as string),
    enabled: pathId != null && pathId.trim().length > 0,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
