"use client";

import { ApiV1Routes } from "@/lib/api-v1-routes";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";

export type ArchitectureTelemetryRoi = {
  totalRuns: number;
  totalHoursSaved: number;
  averageTimeToCommitMs: number;
};

async function fetchArchitectureTelemetryRoi(): Promise<ArchitectureTelemetryRoi> {
  const response = await fetch("/api/proxy/v1/architecture/telemetry/roi", {
    headers: { Accept: "application/json", ...getEffectiveBrowserProxyScopeHeaders() },
  });

  if (!response.ok) {
    throw new Error(`Failed to load telemetry: ${response.statusText}`);
  }

  return (await response.json()) as ArchitectureTelemetryRoi;
}

export function useArchitectureTelemetryRoiQuery() {
  return createOperatorQueryHook<ArchitectureTelemetryRoi>({
    queryKey: operatorQueryKeys.architectureTelemetryRoi,
    queryFn: fetchArchitectureTelemetryRoi,
  });
}

type SponsorRoiAggregates = {
  timeSavedHours: number;
  decisionsAutomated: number;
  complianceRisksMitigated: number;
};

const ROI_PATH = `/api/proxy/${ApiV1Routes.analyticsRoi}`;

async function fetchSponsorRoiAggregates(): Promise<SponsorRoiAggregates> {
  const res = await fetch(
    ROI_PATH,
    mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
  );

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return (await res.json()) as SponsorRoiAggregates;
}

export function useSponsorRoiAggregatesQuery() {
  return createOperatorQueryHook<SponsorRoiAggregates>({
    queryKey: operatorQueryKeys.sponsorRoiAggregates,
    queryFn: fetchSponsorRoiAggregates,
  });
}
