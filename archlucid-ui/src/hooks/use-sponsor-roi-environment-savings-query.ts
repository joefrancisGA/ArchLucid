"use client";

import { useQuery } from "@tanstack/react-query";

import { isBrowser } from "@/lib/api/http";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  fetchSponsorRoiEnvironmentSavings,
  type SponsorRoiEnvironmentSlice,
} from "@/lib/sponsor-roi-query-fetch";

export type { SponsorRoiEnvironmentSlice };

/** Cached environment-savings slices for the sponsor pie card (was an uncached per-mount useEffect fetch). */
export function useSponsorRoiEnvironmentSavingsQuery() {
  return useQuery<SponsorRoiEnvironmentSlice[]>({
    queryKey: operatorQueryKeys.sponsorRoiSummaryExport,
    queryFn: fetchSponsorRoiEnvironmentSavings,
    enabled: isBrowser(),
  });
}
