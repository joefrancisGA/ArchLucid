"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchSecureNowArchitectOutcomeMetrics } from "@/lib/securenow-architect-metrics-api";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";

export const secureNowArchitectMetricsQueryKeys = {
  outcome: (scopeKey: OperatorScopeQueryKey, fromSnapshotId: string | null, toSnapshotId: string | null) =>
    ["securenow-architect-metrics", "outcome", scopeKey, fromSnapshotId, toSnapshotId] as const,
};

export function useSecureNowArchitectOutcomeMetricsQuery(
  fromSnapshotId: string | null,
  toSnapshotId: string | null,
  enabled: boolean,
) {
  const scopeKey = useOperatorScopeQueryKey();
  const fromId = fromSnapshotId?.trim() ?? "";
  const toId = toSnapshotId?.trim() ?? "";

  return useQuery({
    queryKey: secureNowArchitectMetricsQueryKeys.outcome(scopeKey, fromId, toId),
    queryFn: () =>
      fetchSecureNowArchitectOutcomeMetrics(fromId, toId),
    enabled:
      enabled
      && fromId.length > 0
      && toId.length > 0
      && fromId !== toId,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
