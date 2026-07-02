"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchExecutiveRoiSummaryClient } from "@/lib/fetch-executive-roi-summary-client";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export function useExecutiveRoiSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery<ExecutiveRoiSummary>({
    queryKey: operatorQueryKeys.executiveRoiSummary,
    queryFn: fetchExecutiveRoiSummaryClient,
    enabled: options?.enabled ?? true,
  });
}
