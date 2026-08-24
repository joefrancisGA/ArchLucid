"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getGovernancePosture,
  type ArchitecturePostureSummary,
} from "@/lib/api/governance-stickiness-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

type UseGovernancePostureQueryOptions = {
  readonly projectId?: string;
  readonly enabled?: boolean;
};

export function useGovernancePostureQuery(options?: UseGovernancePostureQueryOptions) {
  const projectId = options?.projectId;

  return useQuery<ArchitecturePostureSummary>({
    queryKey: operatorQueryKeys.governancePosture(projectId),
    queryFn: () => getGovernancePosture(projectId),
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
