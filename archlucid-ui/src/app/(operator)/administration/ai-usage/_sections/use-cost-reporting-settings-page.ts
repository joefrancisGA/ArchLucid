"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { fetchAdminAiUsageDashboard } from "@/lib/admin-ai-usage-dashboard";
import {
  DEFAULT_AI_USAGE_DASHBOARD_FILTERS,
  parseAiUsageDashboardFilters,
  serializeAiUsageDashboardFilters,
} from "@/lib/ai-usage-dashboard-filters";
import {
  buildAiUsageDashboardDerived,
  resolveAiUsageEstimatesAsOfUtc,
} from "@/lib/ai-usage-dashboard-model";
import {
  AI_USAGE_COST_REPORTING_SLOW_LOAD_MS,
  AI_USAGE_PAGE_FETCH_TIMEOUT_MS,
  isAbortError,
} from "@/lib/ai-usage-fetch-utils";
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

async function loadProtected<T>(
  loader: () => Promise<T>,
  signal: AbortSignal,
): Promise<LoadOutcome<T>> {
  try {
    return { data: await loader(), error: false, forbidden: false };
  } catch (error) {
    if (signal.aborted || isAbortError(error)) {
      return { data: null, error: true, forbidden: false };
    }

    if (isApiRequestError(error) && error.httpStatus === 403) {
      return { data: null, error: false, forbidden: true };
    }

    return { data: null, error: true, forbidden: false };
  }
}

function stampAsOfUtc<T extends { asOfUtc?: string | null }>(
  payload: T,
  fetchedAtUtc: string,
): T {
  return {
    ...payload,
    asOfUtc: payload.asOfUtc ?? fetchedAtUtc,
  };
}

export type CostReportingSettingsPageLoadOptions = {
  readonly forceRefresh?: boolean;
};

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
  const [estimatesAsOfUtc, setEstimatesAsOfUtc] = useState<string | null>(null);

  const loadGenerationRef = useRef(0);
  const loadAbortControllerRef = useRef<AbortController | null>(null);
  const loadFetchTimeoutRef = useRef<number | null>(null);

  const abortInFlightLoad = useCallback((): void => {
    if (loadFetchTimeoutRef.current !== null) {
      window.clearTimeout(loadFetchTimeoutRef.current);
      loadFetchTimeoutRef.current = null;
    }

    loadAbortControllerRef.current?.abort();
    loadAbortControllerRef.current = null;
  }, []);

  const load = useCallback(async (options?: CostReportingSettingsPageLoadOptions) => {
    abortInFlightLoad();

    const forceRefresh = options?.forceRefresh === true;
    const generation = loadGenerationRef.current + 1;
    loadGenerationRef.current = generation;

    const abortController = new AbortController();
    loadAbortControllerRef.current = abortController;
    const fetchSignal = abortController.signal;

    loadFetchTimeoutRef.current = window.setTimeout(() => {
      abortController.abort();
    }, AI_USAGE_PAGE_FETCH_TIMEOUT_MS);
    const delayedTimerId = window.setTimeout(() => {
      if (loadGenerationRef.current === generation) {
        setCostReportingDelayed(true);
      }
    }, AI_USAGE_COST_REPORTING_SLOW_LOAD_MS);

    setLoading(true);
    setCostReportingError(false);
    setCostReportingDelayed(false);

    if (canViewBudgetDetails) {
      setBudgetLoading(true);
      setAdminLoading(true);
    }

    const costReportingPromise = loadProtected(async () => {
      const fetchedAtUtc = new Date().toISOString();
      const dashboard = normalizeLlmCostReportingDashboardForDisplay(
        await fetchLlmCostReportingDashboard({ signal: fetchSignal }),
      );

      return stampAsOfUtc(dashboard, fetchedAtUtc);
    }, fetchSignal);

    const budgetPromise = canViewBudgetDetails
      ? loadProtected(async () => {
          const fetchedAtUtc = new Date().toISOString();
          const status = await fetchLlmMonthlyDollarBudgetStatusCached({
            ...(forceRefresh ? { force: true } : {}),
            signal: fetchSignal,
          });

          return {
            ...status,
            asOfUtc: status.asOfUtc ?? fetchedAtUtc,
          };
        }, fetchSignal)
      : Promise.resolve({ data: null, error: false, forbidden: false } satisfies LoadOutcome<LlmMonthlyDollarBudgetStatus>);

    const adminPromise = canViewBudgetDetails
      ? loadProtected(async () => {
          const fetchedAtUtc = new Date().toISOString();
          const dashboard = await fetchAdminAiUsageDashboard({ signal: fetchSignal });

          return stampAsOfUtc(dashboard, fetchedAtUtc);
        }, fetchSignal)
      : Promise.resolve({ data: null, error: false, forbidden: false } satisfies LoadOutcome<import("@/lib/admin-ai-usage-dashboard").AdminAiUsageDashboard>);

    try {
      const [costOutcome, budgetOutcome, adminOutcome] = await Promise.all([
        costReportingPromise,
        budgetPromise,
        adminPromise,
      ]);

      if (loadGenerationRef.current !== generation) {
        return;
      }

      setData(costOutcome.data);
      setCostReportingError(costOutcome.error);

      setBudgetStatus(budgetOutcome.data ?? null);
      setBudgetError(budgetOutcome.error);
      setBudgetForbidden(budgetOutcome.forbidden);
      setBudgetLoading(false);

      setAdminDashboard(adminOutcome.data ?? null);
      setAdminError(adminOutcome.error);
      setAdminForbidden(adminOutcome.forbidden);
      setAdminLoading(false);

      const resolvedAsOf = resolveAiUsageEstimatesAsOfUtc([
        costOutcome.data?.asOfUtc,
        budgetOutcome.data?.asOfUtc ?? null,
        adminOutcome.data?.asOfUtc ?? null,
      ]);
      setEstimatesAsOfUtc(resolvedAsOf);
    } finally {
      window.clearTimeout(delayedTimerId);

      if (loadFetchTimeoutRef.current !== null) {
        window.clearTimeout(loadFetchTimeoutRef.current);
        loadFetchTimeoutRef.current = null;
      }

      if (loadAbortControllerRef.current === abortController) {
        loadAbortControllerRef.current = null;
      }

      if (loadGenerationRef.current === generation) {
        setLoading(false);
      }
    }
  }, [abortInFlightLoad, canViewBudgetDetails]);

  useEffect(() => {
    return () => {
      abortInFlightLoad();
    };
  }, [abortInFlightLoad]);

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
        estimatesAsOfUtc,
        billingPeriodUtcMonth: budgetStatus?.utcMonth ?? null,
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
      estimatesAsOfUtc,
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
