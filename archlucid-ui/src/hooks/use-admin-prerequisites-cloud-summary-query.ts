"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchAdminPrerequisitesCloudConnectionsSummary,
  type AdminPrerequisitesCloudConnectionsSummary,
} from "@/lib/fetch-admin-prerequisites-cloud-summary-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

type UseAdminPrerequisitesCloudSummaryQueryOptions = {
  readonly enabled?: boolean;
};

/**
 * Whether any cloud connection is configured, for the settings hub readiness board.
 *
 * Resolves to `null` when the probe fails so callers can report "unknown" rather than
 * "not configured" — a 403 for a non-admin principal must not read as an empty tenant.
 */
export function useAdminPrerequisitesCloudSummaryQuery(
  options?: UseAdminPrerequisitesCloudSummaryQueryOptions,
) {
  return useQuery<AdminPrerequisitesCloudConnectionsSummary | null>({
    queryKey: operatorQueryKeys.adminPrerequisitesCloudSummary,
    queryFn: async () => {
      try {
        return await fetchAdminPrerequisitesCloudConnectionsSummary();
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
