"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchOperationalSecurityFindingDetail } from "@/lib/security-evidence-path-api";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";

export const operationalSecurityFindingDetailQueryKeys = {
  detail: (scopeKey: readonly unknown[], findingId: string | null) =>
    ["operational-security-finding", "detail", ...scopeKey, findingId] as const,
};

export function useOperationalSecurityFindingDetailQuery(findingId: string | null) {
  const scopeKey = useOperatorScopeQueryKey();

  return useQuery({
    queryKey: operationalSecurityFindingDetailQueryKeys.detail(scopeKey, findingId),
    queryFn: () => fetchOperationalSecurityFindingDetail(findingId as string),
    enabled: findingId != null && findingId.trim().length > 0,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
