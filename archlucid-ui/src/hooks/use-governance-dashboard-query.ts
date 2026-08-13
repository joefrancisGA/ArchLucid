"use client";

import { useQuery } from "@tanstack/react-query";

import { getGovernanceDashboard } from "@/lib/api/policy-governance-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import type { GovernanceDashboardSummary } from "@/types/governance-dashboard";

type UseGovernanceDashboardQueryOptions = {
  readonly maxPending?: number;
  readonly maxDecisions?: number;
  readonly maxChanges?: number;
  readonly enabled?: boolean;
};

export function useGovernanceDashboardQuery(options?: UseGovernanceDashboardQueryOptions) {
  const maxPending = options?.maxPending ?? 20;
  const maxDecisions = options?.maxDecisions ?? 20;
  const maxChanges = options?.maxChanges ?? 20;

  return useQuery<GovernanceDashboardSummary>({
    queryKey: operatorQueryKeys.governanceDashboard(maxPending, maxDecisions, maxChanges),
    queryFn: () => getGovernanceDashboard(maxPending, maxDecisions, maxChanges),
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
