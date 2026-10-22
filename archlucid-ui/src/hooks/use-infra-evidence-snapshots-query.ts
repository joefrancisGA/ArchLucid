"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";

export const infraEvidenceSnapshotsQueryKeys = {
  list: (scopeKey: OperatorScopeQueryKey, page: number, pageSize: number) =>
    ["infra-evidence-snapshots", "list", scopeKey, page, pageSize] as const,
};

export function useInfraEvidenceSnapshotsQuery(page = 1, pageSize = 25) {
  const scopeKey = useOperatorScopeQueryKey();

  return useQuery({
    queryKey: infraEvidenceSnapshotsQueryKeys.list(scopeKey, page, pageSize),
    queryFn: () => fetchInfraEvidenceSnapshots(page, pageSize),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
