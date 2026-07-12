"use client";

import { useQuery } from "@tanstack/react-query";

import { isBrowser } from "@/lib/api/http";
import { fetchTenantHomepageSettingsClient } from "@/lib/fetch-tenant-homepage-settings-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { TenantHomepageSettingsResponse } from "@/types/tenant-homepage-settings";

export function useFeaturedCompletedSampleQuery(options?: { enabled?: boolean }) {
  return useQuery<TenantHomepageSettingsResponse>({
    queryKey: operatorQueryKeys.tenantHomepageSettings,
    queryFn: fetchTenantHomepageSettingsClient,
    enabled: isBrowser() && (options?.enabled ?? true),
  });
}
