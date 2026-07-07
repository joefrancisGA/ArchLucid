"use client";

import { useCallback, useEffect, useState } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import {
  type LlmCostReportingDashboard,
  fetchLlmCostReportingDashboard,
} from "@/lib/llm-cost-reporting";
import { normalizeLlmCostReportingDashboardForDisplay } from "@/lib/llm-cost-reporting-display-labels";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import type {
  CostReportingSettingsPageSurface,
  CostReportingSettingsPageViewModel,
} from "./cost-reporting-settings-page-view-model";
import type { CostReportingSettingsPageServerLoad } from "./load-cost-reporting-settings-page-data";

function resolveSurface(
  isDemo: boolean,
  isAuthorityLoading: boolean,
  isReadAllowed: boolean,
): CostReportingSettingsPageSurface {
  if (isDemo) {
    return "demo";
  }

  if (isAuthorityLoading) {
    return "authority_loading";
  }

  if (!isReadAllowed) {
    return "forbidden";
  }

  return "granted";
}

export function useCostReportingSettingsPage(
  loaded: CostReportingSettingsPageServerLoad,
): CostReportingSettingsPageViewModel {
  const isDemo = loaded.demo;
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  // Viewing cost/usage data only requires ReadAuthority on the backend (TenantLlmCostReportingController) —
  // there is nothing to mutate on this page, so the stricter AdminAuthority nav gate this page previously enforced
  // was blocking non-Admin callers from a read-only report they were otherwise entitled to see.
  const isReadAllowed = callerAuthorityRank >= AUTHORITY_RANK.ReadAuthority;
  const surface = resolveSurface(isDemo, isAuthorityLoading, isReadAllowed);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LlmCostReportingDashboard | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const next = normalizeLlmCostReportingDashboardForDisplay(await fetchLlmCostReportingDashboard());
      setData(next);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemo || !isReadAllowed) {
      return;
    }

    void load();
  }, [isDemo, isReadAllowed, load]);

  return {
    surface,
    loading,
    data,
    load,
  };
}
