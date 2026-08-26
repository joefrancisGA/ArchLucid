"use client";

import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { useOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { isPilotRoiBaselineComplete } from "@/lib/pilot-roi-baseline-completeness";

type TenantBaselineRoiGatePayload = {
  baselineReviewCycleHours?: unknown;
  manualPrepHoursPerReview?: unknown;
};

async function fetchTenantBaselineRoiGate(): Promise<boolean | null> {
  const baselineRes = await fetch(
    "/api/proxy/v1/tenant/baseline",
    mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
  );

  if (!baselineRes.ok) {
    return null;
  }

  try {
    const baselinePayload = (await baselineRes.json()) as TenantBaselineRoiGatePayload;

    return isPilotRoiBaselineComplete({
      baselineReviewCycleHours: baselinePayload.baselineReviewCycleHours,
      manualPrepHoursPerReview: baselinePayload.manualPrepHoursPerReview,
    });
  } catch {
    return null;
  }
}

type UseTenantBaselineRoiQueryOptions = {
  readonly enabled?: boolean;
};

export function useTenantBaselineRoiQuery(options?: UseTenantBaselineRoiQueryOptions) {
  return useOperatorQueryHook<boolean | null>({
    queryKey: operatorQueryKeys.tenantBaselineRoi,
    queryFn: fetchTenantBaselineRoiGate,
    enabled: options?.enabled ?? true,
  });
}
