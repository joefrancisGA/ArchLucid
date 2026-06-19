"use client";

import { useQuery } from "@tanstack/react-query";

import type { HealthReadyResponse } from "@/lib/health-dashboard-types";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export function useHealthReadySummaryQuery(options?: { enabled?: boolean }) {
  return useQuery<HealthReadyResponse | null>({
    queryKey: operatorQueryKeys.healthReadySummary,
    queryFn: fetchHealthReadySummary,
    enabled: options?.enabled ?? true,
  });
}
