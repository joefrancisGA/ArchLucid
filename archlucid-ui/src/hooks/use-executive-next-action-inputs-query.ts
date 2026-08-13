"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getComplianceDriftTrend } from "@/lib/api";
import { isBrowser } from "@/lib/api/http";
import { type ExecutiveTimeRange, windowForExecutiveRange } from "@/lib/executive-time-range";
import { fetchPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import type { PilotValueReportTimelineRow } from "@/types/pilot-value-report";

export type ExecutiveNextActionInputs = {
  readonly complianceDriftChangeCount: number;
  readonly committedRunsTimeline: readonly PilotValueReportTimelineRow[];
};

function sumDriftChanges(points: { changeCount: number }[]): number {
  return points.reduce((sum, point) => sum + (Number.isFinite(point.changeCount) ? point.changeCount : 0), 0);
}

/**
 *     Value-report + drift inputs for the dashboard next-action card, cached per time range. Keying
 *     by range (not the exact-now window timestamps) is what makes the cache hit across remounts;
 *     the concrete window is computed inside the query function.
 */
export function useExecutiveNextActionInputsQuery(
  range: ExecutiveTimeRange,
  options?: { enabled?: boolean },
) {
  const queryClient = useQueryClient();

  return useQuery<ExecutiveNextActionInputs>({
    queryKey: operatorQueryKeys.executiveNextActionInputs(range),
    queryFn: async () => {
      const { fromUtc, toUtc } = windowForExecutiveRange(range);
      const fromKey = fromUtc ?? "open";

      const report = await queryClient.fetchQuery({
        queryKey: operatorQueryKeys.pilotValueReport(fromKey, toUtc),
        queryFn: () => fetchPilotValueReportJson(fromUtc, toUtc),
        staleTime: OPERATOR_QUERY_STALE_MS,
        gcTime: OPERATOR_QUERY_GC_MS,
      });

      const driftFrom = fromUtc ?? report.fromUtc;

      const driftPoints = await queryClient.fetchQuery({
        queryKey: operatorQueryKeys.complianceDriftTrendRange(driftFrom, report.toUtc),
        queryFn: () => getComplianceDriftTrend(driftFrom, report.toUtc, 1440),
        staleTime: OPERATOR_QUERY_STALE_MS,
        gcTime: OPERATOR_QUERY_GC_MS,
      });

      return {
        complianceDriftChangeCount: sumDriftChanges(driftPoints),
        committedRunsTimeline: report.committedRunsTimeline,
      };
    },
    enabled: isBrowser() && (options?.enabled ?? true),
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
