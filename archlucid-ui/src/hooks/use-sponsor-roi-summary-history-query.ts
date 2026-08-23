"use client";

import { useQuery } from "@tanstack/react-query";

import { isBrowser } from "@/lib/api/http";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  fetchSponsorRoiSummaryHistory,
  type SponsorRoiHistoryPoint,
} from "@/lib/sponsor-roi-query-fetch";

export type { SponsorRoiHistoryPoint };

/** Cached ROI history for the sponsor trend chart (was an uncached per-mount useEffect fetch). */
export function useSponsorRoiSummaryHistoryQuery() {
  return useQuery<SponsorRoiHistoryPoint[]>({
    queryKey: operatorQueryKeys.sponsorRoiSummaryHistory,
    queryFn: fetchSponsorRoiSummaryHistory,
    enabled: isBrowser(),
  });
}
