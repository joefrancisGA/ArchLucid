"use client";

import { useQuery } from "@tanstack/react-query";

import type { HealthReadyResponse } from "@/lib/health-dashboard-types";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import { resolveShellBannerPollIntervalMs } from "@/lib/shell-banner-poll-policy";

type UseHealthReadySummaryQueryOptions = {
  readonly enabled?: boolean;
  /** When true, failed readiness reads throw so refetch errors preserve the last good payload. */
  readonly throwOnUnavailable?: boolean;
  readonly documentHidden?: boolean;
  readonly shouldPoll?: (status: HealthReadyResponse | undefined) => boolean;
  readonly intervalMs?: number;
};

export function useHealthReadySummaryQuery(options?: UseHealthReadySummaryQueryOptions) {
  const throwOnUnavailable = options?.throwOnUnavailable === true;

  return useQuery<HealthReadyResponse | null>({
    // Single cache key — strict callers use throwOnUnavailable in queryFn only.
    queryKey: operatorQueryKeys.healthReadySummary,
    queryFn: async () => {
      const result = await fetchHealthReadySummary();

      if (result === null && throwOnUnavailable) {
        throw new Error("health-ready-summary-unavailable");
      }

      return result;
    },
    enabled: options?.enabled ?? true,
    refetchInterval: (query) =>
      resolveShellBannerPollIntervalMs({
        enabled: options?.enabled ?? true,
        documentHidden: options?.documentHidden ?? false,
        shouldPoll: options?.shouldPoll?.(query.state.data ?? undefined) ?? false,
        intervalMs: options?.intervalMs,
      }),
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
  });
}
