"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchPilotOutcomeSummary } from "@/lib/pilot-outcome-summary";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";

export function usePilotOutcomeSummaryQuery() {
  return useQuery({
    queryKey: operatorQueryKeys.pilotOutcomeSummary,
    queryFn: fetchPilotOutcomeSummary,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
