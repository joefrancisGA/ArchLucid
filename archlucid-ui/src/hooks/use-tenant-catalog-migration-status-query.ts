"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchTenantCatalogMigrationStatus,
  type TenantCatalogMigrationStatus,
} from "@/lib/fetch-tenant-catalog-migration-status";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  resolveTenantCatalogMigrationStaleTime,
} from "@/lib/query/operator-query-stale-time";
import {
  resolveShellBannerPollIntervalMs,
  shouldPollCatalogMigrationBanner,
} from "@/lib/shell-banner-poll-policy";
import { TENANT_MIGRATION_STATUS_POLL_MS } from "@/lib/tenant-migration-banner-copy";

type UseTenantCatalogMigrationStatusQueryOptions = {
  readonly enabled?: boolean;
  readonly documentHidden?: boolean;
};

export function useTenantCatalogMigrationStatusQuery(
  options?: UseTenantCatalogMigrationStatusQueryOptions,
) {
  return useQuery<TenantCatalogMigrationStatus>({
    queryKey: operatorQueryKeys.tenantCatalogMigrationStatus,
    queryFn: async () => {
      const status = await fetchTenantCatalogMigrationStatus();

      if (status === null) {
        throw new Error("tenant-catalog-migration-status-unavailable");
      }

      return status;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: (query) =>
      resolveShellBannerPollIntervalMs({
        enabled: options?.enabled ?? true,
        documentHidden: options?.documentHidden ?? false,
        shouldPoll: shouldPollCatalogMigrationBanner(query.state.data),
        intervalMs: TENANT_MIGRATION_STATUS_POLL_MS,
      }),
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: (query) => resolveTenantCatalogMigrationStaleTime(query.state.data),
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
