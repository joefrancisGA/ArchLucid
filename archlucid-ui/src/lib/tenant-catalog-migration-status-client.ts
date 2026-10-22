import {
  fetchTenantCatalogMigrationStatus,
  type TenantCatalogMigrationStatus,
} from "@/lib/fetch-tenant-catalog-migration-status";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getOperatorQueryClient } from "@/lib/query/operator-query-client";
import { OPERATOR_QUERY_STALE_MS } from "@/lib/query/operator-query-stale-time";

async function fetchTenantCatalogMigrationStatusOrThrow(): Promise<TenantCatalogMigrationStatus> {
  const status = await fetchTenantCatalogMigrationStatus();

  if (status === null) {
    throw new Error("tenant-catalog-migration-status-unavailable");
  }

  return status;
}

/** Imperative read through the shared TanStack Query cache. */
export async function fetchTenantCatalogMigrationStatusCached(
  options?: { readonly force?: boolean },
): Promise<TenantCatalogMigrationStatus> {
  const queryClient = getOperatorQueryClient();

  if (options?.force === true) {
    await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.tenantCatalogMigrationStatus });
  }

  return queryClient.fetchQuery({
    queryKey: operatorQueryKeys.tenantCatalogMigrationStatus,
    queryFn: fetchTenantCatalogMigrationStatusOrThrow,
    staleTime: OPERATOR_QUERY_STALE_MS,
  });
}

export async function invalidateTenantCatalogMigrationStatusCache(): Promise<void> {
  await getOperatorQueryClient().invalidateQueries({
    queryKey: operatorQueryKeys.tenantCatalogMigrationStatus,
  });
}
