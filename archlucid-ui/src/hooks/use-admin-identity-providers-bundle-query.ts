"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchIdentityProvidersPageBundle,
  type AdminIdentityProvidersPageBundleResponse,
} from "@/lib/fetch-identity-providers-page-bundle-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

type UseAdminIdentityProvidersBundleQueryOptions = {
  readonly enabled?: boolean;
};

/**
 * Admin-only identity diagnostics. Callers must gate `enabled` on admin authority —
 * a non-admin read returns 403 and must be reported as "unknown", never "not configured".
 */
export function useAdminIdentityProvidersBundleQuery(
  options?: UseAdminIdentityProvidersBundleQueryOptions,
) {
  return useQuery<AdminIdentityProvidersPageBundleResponse | null>({
    queryKey: operatorQueryKeys.adminIdentityProvidersPageBundle,
    queryFn: async () => {
      try {
        return await fetchIdentityProvidersPageBundle();
      } catch {
        return null;
      }
    },
    enabled: options?.enabled ?? true,
    retry: false,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
