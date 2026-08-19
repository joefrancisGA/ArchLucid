"use client";

import { useQuery } from "@tanstack/react-query";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import {
  countAuditEventsInWindow,
  type AuditEventCountResult,
} from "@/lib/workspace-health-audit-count";

type UseGovernancePrecommitBlockedCountQueryOptions = {
  readonly enabled?: boolean;
};

export function useGovernancePrecommitBlockedCountQuery(
  fromUtcIso: string,
  toUtcIso: string,
  options?: UseGovernancePrecommitBlockedCountQueryOptions,
) {
  return useQuery<AuditEventCountResult>({
    queryKey: operatorQueryKeys.governancePrecommitBlockedCount(fromUtcIso, toUtcIso),
    queryFn: () =>
      countAuditEventsInWindow({
        eventType: "GovernancePreCommitBlocked",
        fromUtcIso,
        toUtcIso,
      }),
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
