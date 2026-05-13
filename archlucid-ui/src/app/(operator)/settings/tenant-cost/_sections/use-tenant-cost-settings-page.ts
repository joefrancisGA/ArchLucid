"use client";

import { useCallback, useEffect, useState } from "react";

import { getTenantCostEstimate } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { TenantCostEstimateResponse } from "@/types/tenant-cost-estimate";

export type UseTenantCostSettingsPageModel = {
  estimate: TenantCostEstimateResponse | null;
  failure: ApiLoadFailureState | null;
  loading: boolean;
};

export function useTenantCostSettingsPage(): UseTenantCostSettingsPageModel {
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [estimate, setEstimate] = useState<TenantCostEstimateResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const data = await getTenantCostEstimate();
      setEstimate(data);
    } catch (e: unknown) {
      setEstimate(null);
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    estimate,
    failure,
    loading,
  };
}
