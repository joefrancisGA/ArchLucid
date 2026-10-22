"use client";

import { useQuery } from "@tanstack/react-query";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { shouldSkipArchitectureOnlyProxyApi } from "@/lib/product-line/architecture-only-proxy-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import {
  fetchTenantBrandingPresentation,
  shouldSkipTenantBrandingPresentationFetch,
} from "@/lib/tenant-branding-client";
import type {
  TenantBrandingDisplayContext,
  TenantBrandingPresentationPayload,
} from "@/types/tenant-branding-presentation";

type UseTenantBrandingPresentationQueryOptions = {
  readonly context: TenantBrandingDisplayContext;
  readonly enabled?: boolean;
};

export function useTenantBrandingPresentationQuery(options: UseTenantBrandingPresentationQueryOptions) {
  const { productLine } = useProductLine();
  const authEnabled = !shouldSkipTenantBrandingPresentationFetch();
  const queryEnabled = options.enabled ?? true;
  const skipArchitectureOnlyApi = shouldSkipArchitectureOnlyProxyApi(productLine);

  return useQuery<TenantBrandingPresentationPayload | null>({
    queryKey: operatorQueryKeys.tenantBrandingPresentation(options.context),
    queryFn: () => fetchTenantBrandingPresentation(options.context),
    enabled: authEnabled && queryEnabled && !skipArchitectureOnlyApi,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
