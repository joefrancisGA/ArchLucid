"use client";

import { useQuery } from "@tanstack/react-query";

import { isBrowser } from "@/lib/api/http";
import { fetchSponsorDashboardBundleClient } from "@/lib/fetch-sponsor-dashboard-bundle-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function useSponsorDashboardBundleQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: operatorQueryKeys.sponsorDashboardBundle,
    queryFn: fetchSponsorDashboardBundleClient,
    enabled: isBrowser() && (options?.enabled ?? true),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
