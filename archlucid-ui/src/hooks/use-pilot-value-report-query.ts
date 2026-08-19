"use client";

import { useQuery } from "@tanstack/react-query";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import { fetchPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

type UsePilotValueReportQueryOptions = {
  readonly enabled?: boolean;
  readonly refetchIntervalMs?: number;
};

export function usePilotValueReportQuery(
  fromUtc: string | null,
  toUtc: string,
  options?: UsePilotValueReportQueryOptions,
) {
  const fromKey = fromUtc ?? "open";

  return useQuery<PilotValueReportJson>({
    queryKey: operatorQueryKeys.pilotValueReport(fromKey, toUtc),
    queryFn: () => fetchPilotValueReportJson(fromUtc, toUtc),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchIntervalMs ?? false,
    refetchIntervalInBackground: false,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
