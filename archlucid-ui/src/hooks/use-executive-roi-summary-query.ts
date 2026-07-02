"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchExecutiveRoiSummaryClient,
  type ExecutiveRoiSummary,
} from "@/lib/fetch-executive-roi-summary-client";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export function useExecutiveRoiSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery<ExecutiveRoiSummary>({
    queryKey: operatorQueryKeys.executiveRoiSummary,
    queryFn: fetchExecutiveRoiSummaryClient,
    enabled: options?.enabled ?? true,
  });
}
