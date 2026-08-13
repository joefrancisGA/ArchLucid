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

function rollingBounds30Days(): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - 30);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

export type WorkspaceHealthPrecommitAuditCounts = {
  readonly blocked30d: AuditEventCountResult;
  readonly warned30d: AuditEventCountResult;
};

type UseWorkspaceHealthPrecommitAuditCountsQueryOptions = {
  readonly enabled?: boolean;
  readonly refetchIntervalMs?: number;
};

export function useWorkspaceHealthPrecommitAuditCountsQuery(
  options?: UseWorkspaceHealthPrecommitAuditCountsQueryOptions,
) {
  return useQuery<WorkspaceHealthPrecommitAuditCounts>({
    queryKey: operatorQueryKeys.workspaceHealthPrecommitAuditCounts30d,
    queryFn: async () => {
      const bounds = rollingBounds30Days();

      const [blocked30d, warned30d] = await Promise.all([
        countAuditEventsInWindow({
          eventType: "GovernancePreCommitBlocked",
          fromUtcIso: bounds.fromUtc,
          toUtcIso: bounds.toUtc,
        }),
        countAuditEventsInWindow({
          eventType: "GovernancePreCommitWarned",
          fromUtcIso: bounds.fromUtc,
          toUtcIso: bounds.toUtc,
        }),
      ]);

      return { blocked30d, warned30d };
    },
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchIntervalMs ?? false,
    refetchIntervalInBackground: false,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
