"use client";

import { useCallback, useEffect, useState } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import {
  type LlmCostReportingDashboard,
  fetchLlmCostReportingDashboard,
} from "@/lib/llm-cost-reporting";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import type {
  CostReportingSettingsPageSurface,
  CostReportingSettingsPageViewModel,
} from "./cost-reporting-settings-page-view-model";
import type { CostReportingSettingsPageServerLoad } from "./load-cost-reporting-settings-page-data";

function resolveSurface(
  isDemo: boolean,
  isAuthorityLoading: boolean,
  isAdmin: boolean,
): CostReportingSettingsPageSurface {
  if (isDemo) {
    return "demo";
  }

  if (isAuthorityLoading) {
    return "authority_loading";
  }

  if (!isAdmin) {
    return "forbidden";
  }

  return "admin";
}

export function useCostReportingSettingsPage(
  loaded: CostReportingSettingsPageServerLoad,
): CostReportingSettingsPageViewModel {
  const isDemo = loaded.demo;
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const surface = resolveSurface(isDemo, isAuthorityLoading, isAdmin);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LlmCostReportingDashboard | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const next = await fetchLlmCostReportingDashboard();
      setData(next);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemo || !isAdmin) {
      return;
    }

    void load();
  }, [isAdmin, isDemo, load]);

  return {
    surface,
    loading,
    data,
    load,
  };
}
