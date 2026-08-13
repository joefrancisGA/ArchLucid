"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getGovernanceDecisionsNeededSummary,
  type GovernanceDecisionsNeededSummary,
} from "@/lib/api/governance-stickiness-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

type UseGovernanceDecisionsNeededSummaryQueryOptions = {
  readonly projectId?: string;
  readonly enabled?: boolean;
  readonly refetchIntervalMs?: number;
};

export function useGovernanceDecisionsNeededSummaryQuery(
  options?: UseGovernanceDecisionsNeededSummaryQueryOptions,
) {
  const projectId = options?.projectId;

  return useQuery<GovernanceDecisionsNeededSummary>({
    queryKey: operatorQueryKeys.governanceDecisionsNeededSummary(projectId),
    queryFn: () => getGovernanceDecisionsNeededSummary(projectId),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchIntervalMs ?? false,
    refetchIntervalInBackground: false,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
