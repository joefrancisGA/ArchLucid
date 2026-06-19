"use client";

import { useQuery } from "@tanstack/react-query";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  fetchTenantUsageStatus,
  shouldSkipTenantUsageStatusFetch,
} from "@/lib/tenant-usage-status-client";
import type { TeamExpansionNudgeStatusPayload } from "@/lib/team-expansion-nudge-trigger";

export function useTenantUsageStatusQuery() {
  return useQuery<TeamExpansionNudgeStatusPayload | null>({
    queryKey: operatorQueryKeys.tenantUsageStatus,
    queryFn: fetchTenantUsageStatus,
    enabled: !shouldSkipTenantUsageStatusFetch(),
  });
}
