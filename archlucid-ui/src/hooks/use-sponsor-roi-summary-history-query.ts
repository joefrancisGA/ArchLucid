"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiV1Routes } from "@/lib/api-v1-routes";
import { isBrowser } from "@/lib/api/http";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export type SponsorRoiHistoryPoint = {
  snapshotUtc: string;
  totalEstimatedUsdSavings: number;
  criticalSecurityFindings: number;
  realRunCount: number;
  simulatorRunCount: number;
  realModeSavingsUsd: number;
  isMixedMode: boolean;
};

async function fetchSponsorRoiSummaryHistory(): Promise<SponsorRoiHistoryPoint[]> {
  const response = await fetch(
    `/api/proxy/${ApiV1Routes.roiSponsorSummary}/history`,
    mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const json = (await response.json()) as { points?: SponsorRoiHistoryPoint[] };

  return json.points ?? [];
}

/** Cached ROI history for the sponsor trend chart (was an uncached per-mount useEffect fetch). */
export function useSponsorRoiSummaryHistoryQuery() {
  return useQuery<SponsorRoiHistoryPoint[]>({
    queryKey: operatorQueryKeys.sponsorRoiSummaryHistory,
    queryFn: fetchSponsorRoiSummaryHistory,
    enabled: isBrowser(),
  });
}
