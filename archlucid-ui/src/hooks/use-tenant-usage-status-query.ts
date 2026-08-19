"use client";

import { useQuery } from "@tanstack/react-query";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  fetchTenantUsageStatus,
  shouldSkipTenantUsageStatusFetch,
} from "@/lib/tenant-usage-status-client";
import type { TeamExpansionNudgeStatusPayload } from "@/lib/team-expansion-nudge-trigger";

type UseTenantUsageStatusQueryOptions = {
  readonly enabled?: boolean;
};

export function useTenantUsageStatusQuery(options?: UseTenantUsageStatusQueryOptions) {
  const authEnabled = !shouldSkipTenantUsageStatusFetch();
  const queryEnabled = options?.enabled ?? true;

  return useQuery<TeamExpansionNudgeStatusPayload | null>({
    queryKey: operatorQueryKeys.tenantUsageStatus,
    queryFn: fetchTenantUsageStatus,
    enabled: authEnabled && queryEnabled,
  });
}
