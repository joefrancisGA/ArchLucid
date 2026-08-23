"use client";

import { getGovernanceDashboard } from "@/lib/api/policy-governance-api";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { GovernanceDashboardSummary } from "@/types/governance-dashboard";

type UseGovernanceDashboardQueryOptions = {
  readonly maxPending?: number;
  readonly maxDecisions?: number;
  readonly maxChanges?: number;
  readonly enabled?: boolean;
  readonly refetchIntervalMs?: number;
};

export function useGovernanceDashboardQuery(options?: UseGovernanceDashboardQueryOptions) {
  const maxPending = options?.maxPending ?? 20;
  const maxDecisions = options?.maxDecisions ?? 20;
  const maxChanges = options?.maxChanges ?? 20;

  return createOperatorQueryHook<GovernanceDashboardSummary>({
    queryKey: operatorQueryKeys.governanceDashboard(maxPending, maxDecisions, maxChanges),
    queryFn: () => getGovernanceDashboard(maxPending, maxDecisions, maxChanges),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchIntervalMs ?? false,
    refetchIntervalInBackground: false,
  });
}
