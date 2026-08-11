"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiV1Routes } from "@/lib/api-v1-routes";
import { isBrowser } from "@/lib/api/http";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export type ExecutiveRoiEnvironmentSlice = {
  environment: string;
  estimatedUsdSavings: number;
};

export async function fetchExecutiveRoiEnvironmentSavings(): Promise<ExecutiveRoiEnvironmentSlice[]> {
  const response = await fetch(
    `/api/proxy/${ApiV1Routes.roiExecutiveSummary}/export`,
    mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const json = (await response.json()) as { savingsByEnvironment?: ExecutiveRoiEnvironmentSlice[] };

  return json.savingsByEnvironment ?? [];
}

/** Cached environment-savings slices for the executive pie card (was an uncached per-mount useEffect fetch). */
export function useExecutiveRoiEnvironmentSavingsQuery() {
  return useQuery<ExecutiveRoiEnvironmentSlice[]>({
    queryKey: operatorQueryKeys.executiveRoiSummaryExport,
    queryFn: fetchExecutiveRoiEnvironmentSavings,
    enabled: isBrowser(),
  });
}
