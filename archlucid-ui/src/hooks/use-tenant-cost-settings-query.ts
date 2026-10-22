"use client";

import { useQuery } from "@tanstack/react-query";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import { fetchTenantCostSettings } from "@/lib/tenant-cost-settings-client";

type UseTenantCostSettingsQueryOptions = {
  readonly enabled?: boolean;
};

export function useTenantCostSettingsQuery(options?: UseTenantCostSettingsQueryOptions) {
  return useQuery({
    queryKey: operatorQueryKeys.tenantCostSettings,
    queryFn: fetchTenantCostSettings,
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
