"use client";

import { useQuery } from "@tanstack/react-query";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  fetchTenantTrialStatus,
  shouldSkipTenantTrialStatusFetch,
  type TenantTrialStatusClientPayload,
} from "@/lib/tenant-trial-status-client";

export function useTenantTrialStatusQuery() {
  return useQuery<TenantTrialStatusClientPayload | null>({
    queryKey: operatorQueryKeys.tenantTrialStatus,
    queryFn: fetchTenantTrialStatus,
    enabled: !shouldSkipTenantTrialStatusFetch(),
  });
}
