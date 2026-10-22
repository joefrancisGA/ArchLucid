"use client";

import { useQuery } from "@tanstack/react-query";

import { isBrowser } from "@/lib/api/http";
import { fetchSponsorRoiSummaryClient } from "@/lib/fetch-sponsor-roi-summary-client";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export function useSponsorRoiSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery<SponsorRoiSummary>({
    queryKey: operatorQueryKeys.sponsorRoiSummary,
    queryFn: fetchSponsorRoiSummaryClient,
    // Avoid SSR proxy fetches (relative `/api/proxy` is browser-only); legacy useEffect only ran client-side.
    enabled: isBrowser() && (options?.enabled ?? true),
  });
}
