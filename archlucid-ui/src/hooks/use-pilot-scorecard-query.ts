"use client";

import { useQuery } from "@tanstack/react-query";

import { getPilotScorecard } from "@/lib/api/pilots-marketing";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  OPERATOR_QUERY_GC_MS,
  OPERATOR_QUERY_STALE_MS,
} from "@/lib/query/operator-query-stale-time";
import type { PilotScorecardJson } from "@/types/pilot-scorecard";

export function usePilotScorecardQuery(options?: { readonly enabled?: boolean }) {
  return useQuery<PilotScorecardJson | null>({
    queryKey: operatorQueryKeys.pilotScorecard,
    queryFn: async () => {
      try {
        return await getPilotScorecard();
      } catch {
        return null;
      }
    },
    enabled: options?.enabled ?? true,
    staleTime: OPERATOR_QUERY_STALE_MS,
    gcTime: OPERATOR_QUERY_GC_MS,
    retry: false,
  });
}
