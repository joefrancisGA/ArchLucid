"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { fetchAdminAiUsageDashboard } from "@/lib/admin-ai-usage-dashboard";
import {
  DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
  parseAiUsageDashboardFilters,
  serializeAiUsageDashboardFilters,
} from "@/lib/ai-usage-dashboard-filters";
import { buildAiUsageDashboardDerived } from "@/lib/ai-usage-dashboard-model";
import { isApiRequestError } from "@/lib/api-request-error";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import {
  type LlmCostReportingDashboard,
  fetchLlmCostReportingDashboard,
} from "@/lib/llm-cost-reporting";
import { normalizeLlmCostReportingDashboardForDisplay } from "@/lib/llm-cost-reporting-display-labels";
import {
  fetchLlmMonthlyDollarBudgetStatusCached,
  type LlmMonthlyDollarBudgetStatus,
} from "@/lib/llm-monthly-budget-status";
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

type LoadOutcome<T> = {
  readonly data: T | null;
  readonly error: boolean;
  readonly forbidden: boolean;
};

async function loadProtected<T>(loader: () => Promise<T>): Promise<LoadOutcome<T>> {
  try {
    return { data: await loader(), error: false, forbidden: false };
  } catch (error) {
    if (isApiRequestError(error) && error.httpStatus === 403) {
      return { data: null, error: false, forbidden: true };
    }

    return { data: null, error: true, forbidden: false };
  }
}

export function useCostReportingSettingsPage(
  loaded: CostReportingSettingsPageServerLoad,
): CostReportingSettingsPageViewModel {
  const isDemo = loaded.demo;
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isReadAllowed = callerAuthorityRank >= AUTHORITY_RANK.ReadAuthority;
  const canViewBudgetDetails = callerAuthorityRank >= AUTHORITY_RANK.ExecuteAuthority;
  const canManageBudget = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const surface = resolveSurface(isDemo, isAuthorityLoading, isReadAllowed);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseAiUsageDashboardFilters(searchParams), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LlmCostReportingDashboard | null>(null);
  const [costReportingError, setCostReportingError] = useState(false);
  const [costReportingDelayed, setCostReportingDelayed] = useState(false);
  const [budgetStatus, setBudgetStatus] = useState<LlmMonthlyDollarBudgetStatus | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(canViewBudgetDetails);
  const [budgetError, setBudgetError] = useState(false);
  const [budgetForbidden, setBudgetForbidden] = useState(false);
  const [adminDashboard, setAdminDashboard] = useState<import("@/lib/admin-ai-usage-dashboard").AdminAiUsageDashboard | null>(null);
  const [adminLoading, setAdminLoading] = useState(canViewBudgetDetails);
  const [adminError, setAdminError] = useState(false);
  const [adminForbidden, setAdminForbidden] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setCostReportingError(false);
    setCostReportingDelayed(false);

    if (canViewBudgetDetails) {
      setBudgetLoading(true);
      setAdminLoading(true);
    }

    try {
      const next = normalizeLlmCostReportingDashboardForDisplay(await fetchLlmCostReportingDashboard());
      setData(next);
      setCostReportingDelayed(false);
    } catch {
      setData(null);
      setCostReportingError(true);
    } finally {
      setLoading(false);
    }

    if (!canViewBudgetDetails) {
      setBudgetLoading(false);
      setAdminLoading(false);
      return;
    }

    const [budgetOutcome, adminOutcome] = await Promise.all([
      loadProtected(() => fetchLlmMonthlyDollarBudgetStatusCached({ force: true })),
      loadProtected(() => fetchAdminAiUsageDashboard()),
    ]);

    setBudgetStatus(budgetOutcome.data ?? null);
    setBudgetError(budgetOutcome.error);
    setBudgetForbidden(budgetOutcome.forbidden);
    setBudgetLoading(false);

    setAdminDashboard(adminOutcome.data ?? null);
    setAdminError(adminOutcome.error);
    setAdminForbidden(adminOutcome.forbidden);
    setAdminLoading(false);
  }, [canViewBudgetDetails]);

  const setFilters = useCallback(
    (nextFilters: typeof DEFAULT_AI_USAGE_DASHBOARD_FILTERS) => {
      const params = serializeAiUsageDashboardFilters(nextFilters);
      const query = params.toString();

      router.replace(query.length > 0 ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  useEffect(() => {
    if (isDemo || !isReadAllowed) {
      return;
    }

    void load();
  }, [isDemo, isReadAllowed, load]);

  const derived = useMemo(
    () =>
      buildAiUsageDashboardDerived({
        costReporting: data,
        costReportingLoading: loading,
        costReportingError,
        costReportingDelayed,
        budgetStatus,
        budgetLoading,
        budgetError,
        budgetForbidden,
        adminDashboard,
        adminLoading,
        adminError,
        adminForbidden,
        filters,
        canViewBudgetDetails,
        canManageBudget,
      }),
    [
      adminDashboard,
      adminError,
      adminForbidden,
      adminLoading,
      budgetError,
      budgetForbidden,
      budgetLoading,
      budgetStatus,
      canManageBudget,
      canViewBudgetDetails,
      costReportingDelayed,
      costReportingError,
      data,
      filters,
      loading,
    ],
  );

  return {
    surface,
    loading,
    data,
    budgetStatus,
    adminDashboard,
    derived,
    filters,
    canViewBudgetDetails,
    canManageBudget,
    showDetailedActivityLink: isArchLucidInternalOperatorShellEnv(),
    load,
    setFilters,
  };
}
