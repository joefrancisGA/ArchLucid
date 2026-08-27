"use client";

import { useMemo } from "react";

import { useGovernanceDashboardQuery } from "@/hooks/use-governance-dashboard-query";
import { useGovernanceDecisionsNeededSummaryQuery } from "@/hooks/use-governance-decisions-needed-summary-query";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { GovernanceDashboardSummary } from "@/types/governance-dashboard";
import {
  buildGovernanceOverviewSummaryMetrics,
  type GovernanceOverviewSummaryMetrics,
} from "./governance-overview-summary";

export type GovernanceOverviewLoadState =
  | { readonly status: "loading" }
  | {
      readonly status: "ready";
      readonly dashboard: GovernanceDashboardSummary;
      readonly metrics: GovernanceOverviewSummaryMetrics;
    }
  | { readonly status: "error"; readonly failure: ApiLoadFailureState };

export type UseGovernanceOverviewLoadStateResult = {
  readonly loadState: GovernanceOverviewLoadState;
  readonly lastRefreshedAt: Date | null;
  readonly summaryRefreshing: boolean;
  readonly retryOverview: () => void;
  readonly workspaceIsIdle: boolean;
};

export function useGovernanceOverviewLoadState(): UseGovernanceOverviewLoadStateResult {
  const dashboardQuery = useGovernanceDashboardQuery();
  const decisionsQuery = useGovernanceDecisionsNeededSummaryQuery();

  const loadState = useMemo((): GovernanceOverviewLoadState => {
    if (dashboardQuery.isPending || decisionsQuery.isPending) {
      return { status: "loading" };
    }

    if (dashboardQuery.isError) {
      return { status: "error", failure: toApiLoadFailure(dashboardQuery.error) };
    }

    if (decisionsQuery.isError) {
      return { status: "error", failure: toApiLoadFailure(decisionsQuery.error) };
    }

    if (dashboardQuery.data === undefined || decisionsQuery.data === undefined) {
      return { status: "loading" };
    }

    return {
      status: "ready",
      dashboard: dashboardQuery.data,
      metrics: buildGovernanceOverviewSummaryMetrics(dashboardQuery.data, decisionsQuery.data),
    };
  }, [
    dashboardQuery.data,
    dashboardQuery.error,
    dashboardQuery.isError,
    dashboardQuery.isPending,
    decisionsQuery.data,
    decisionsQuery.error,
    decisionsQuery.isError,
    decisionsQuery.isPending,
  ]);

  const lastRefreshedAt = useMemo((): Date | null => {
    const dashboardUpdatedAt = dashboardQuery.dataUpdatedAt;
    const decisionsUpdatedAt = decisionsQuery.dataUpdatedAt;
    const timestamps = [dashboardUpdatedAt, decisionsUpdatedAt].filter((value) => value > 0);

    if (timestamps.length === 0) {
      return null;
    }

    return new Date(Math.max(...timestamps));
  }, [dashboardQuery.dataUpdatedAt, decisionsQuery.dataUpdatedAt]);

  const summaryRefreshing = dashboardQuery.isFetching || decisionsQuery.isFetching;

  const retryOverview = (): void => {
    void dashboardQuery.refetch();
    void decisionsQuery.refetch();
  };

  const workspaceIsIdle =
    loadState.status === "ready" &&
    loadState.metrics.pendingApprovalRequests === 0 &&
    loadState.metrics.approvedReviewPackages === 0 &&
    loadState.metrics.blockingFindingsTotal === 0 &&
    loadState.metrics.recentDecisions === 0 &&
    loadState.metrics.policyActivations === 0;

  return {
    loadState,
    lastRefreshedAt,
    summaryRefreshing,
    retryOverview,
    workspaceIsIdle,
  };
}
