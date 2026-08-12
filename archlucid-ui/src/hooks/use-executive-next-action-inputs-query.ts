"use client";

import { useQuery } from "@tanstack/react-query";

import { getComplianceDriftTrend } from "@/lib/api";
import { isBrowser } from "@/lib/api/http";
import { type ExecutiveTimeRange, windowForExecutiveRange } from "@/lib/executive/executive-time-range";
import { fetchPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { PilotValueReportTimelineRow } from "@/types/pilot-value-report";

export type ExecutiveNextActionInputs = {
  readonly complianceDriftChangeCount: number;
  readonly committedRunsTimeline: readonly PilotValueReportTimelineRow[];
};

function sumDriftChanges(points: { changeCount: number }[]): number {
  return points.reduce((sum, point) => sum + (Number.isFinite(point.changeCount) ? point.changeCount : 0), 0);
}

async function fetchExecutiveNextActionInputs(range: ExecutiveTimeRange): Promise<ExecutiveNextActionInputs> {
  const { fromUtc, toUtc } = windowForExecutiveRange(range);
  const report = await fetchPilotValueReportJson(fromUtc, toUtc);
  const driftPoints = await getComplianceDriftTrend(fromUtc ?? report.fromUtc, report.toUtc, 1440);

  return {
    complianceDriftChangeCount: sumDriftChanges(driftPoints),
    committedRunsTimeline: report.committedRunsTimeline,
  };
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
  return useQuery<ExecutiveNextActionInputs>({
    queryKey: operatorQueryKeys.executiveNextActionInputs(range),
    queryFn: () => fetchExecutiveNextActionInputs(range),
    enabled: isBrowser() && (options?.enabled ?? true),
  });
}
