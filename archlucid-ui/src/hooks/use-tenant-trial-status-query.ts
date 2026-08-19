"use client";

import { useQuery } from "@tanstack/react-query";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  resolveTenantTrialStatusStaleTime,
} from "@/lib/query/operator-query-stale-time";
import {
  fetchTenantTrialStatus,
  shouldSkipTenantTrialStatusFetch,
  type TenantTrialStatusClientPayload,
} from "@/lib/tenant-trial-status-client";

type UseTenantTrialStatusQueryOptions = {
  readonly enabled?: boolean;
};

export function useTenantTrialStatusQuery(options?: UseTenantTrialStatusQueryOptions) {
  const authEnabled = !shouldSkipTenantTrialStatusFetch();
  const queryEnabled = options?.enabled ?? true;

  return useQuery<TenantTrialStatusClientPayload | null>({
    queryKey: operatorQueryKeys.tenantTrialStatus,
    queryFn: fetchTenantTrialStatus,
    enabled: authEnabled && queryEnabled,
    staleTime: (query) => resolveTenantTrialStatusStaleTime(query.state.data),
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
