"use client";

import { useQuery } from "@tanstack/react-query";

import { isBrowser } from "@/lib/api/http";
import { fetchExecutiveRoiSummaryClient } from "@/lib/fetch-executive-roi-summary-client";
import type { ExecutiveRoiSummary } from "@/lib/executive/executive-summary-markdown";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export function useExecutiveRoiSummaryQuery(options?: { enabled?: boolean }) {
  return useQuery<ExecutiveRoiSummary>({
    queryKey: operatorQueryKeys.executiveRoiSummary,
    queryFn: fetchExecutiveRoiSummaryClient,
    // Avoid SSR proxy fetches (relative `/api/proxy` is browser-only); legacy useEffect only ran client-side.
    enabled: isBrowser() && (options?.enabled ?? true),
  });
}
