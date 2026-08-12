"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useComplianceDriftTrendQuery } from "@/hooks/use-compliance-drift-trend-query";
import { useExecutiveRoiSummaryQuery } from "@/hooks/use-executive-roi-summary-query";
import type { ExecutiveRoiSummary } from "@/lib/executive/executive-summary-markdown";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

export type ExecutiveDashboardData = {
  summary: ExecutiveRoiSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  driftPoints: ComplianceDriftTrendPoint[];
  driftLoading: boolean;
  driftError: boolean;
  refreshing: boolean;
  lastRefreshedAt: Date | null;
  refreshDashboard: () => Promise<void>;
};

const ExecutiveDashboardDataContext = createContext<ExecutiveDashboardData | undefined>(undefined);

/** Fetches executive-summary and compliance-drift once; children read via `useExecutiveDashboardData()`. */
export function ExecutiveDashboardDataProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const queryClient = useQueryClient();
  const summaryQuery = useExecutiveRoiSummaryQuery();
  const driftQuery = useComplianceDriftTrendQuery();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const summary = summaryQuery.data ?? null;
  const summaryLoading =
    summaryQuery.isPending ||
    (summary === null && !summaryQuery.isFetched);
  const summaryError =
    summaryQuery.isError
      ? summaryQuery.error instanceof Error
        ? summaryQuery.error.message
        : "Failed to load executive KPIs."
      : null;

  const driftPoints = useMemo(() => driftQuery.data ?? [], [driftQuery.data]);
  const driftLoading =
    driftQuery.isPending ||
    driftQuery.isFetching ||
    (driftPoints.length === 0 && !driftQuery.isFetched);
  const driftError = driftQuery.isError;

  useEffect(() => {
    if (summaryQuery.isFetched && driftQuery.isFetched && lastRefreshedAt === null) {
      setLastRefreshedAt(new Date());
    }
  }, [summaryQuery.isFetched, driftQuery.isFetched, lastRefreshedAt]);

  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: operatorQueryKeys.executiveRoiSummary }),
        queryClient.invalidateQueries({ queryKey: operatorQueryKeys.complianceDriftTrend30d }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: operatorQueryKeys.executiveRoiSummary }),
        queryClient.refetchQueries({ queryKey: operatorQueryKeys.complianceDriftTrend30d }),
      ]);
      setLastRefreshedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const value = useMemo<ExecutiveDashboardData>(
    () => ({
      summary,
      summaryLoading,
      summaryError,
      driftPoints,
      driftLoading,
      driftError,
      refreshing,
      lastRefreshedAt,
      refreshDashboard,
    }),
    [
      summary,
      summaryLoading,
      summaryError,
      driftPoints,
      driftLoading,
      driftError,
      refreshing,
      lastRefreshedAt,
      refreshDashboard,
    ],
  );

  return (
    <ExecutiveDashboardDataContext.Provider value={value}>
      {children}
    </ExecutiveDashboardDataContext.Provider>
  );
}

/** Must be called inside `ExecutiveDashboardDataProvider`. */
export function useExecutiveDashboardData(): ExecutiveDashboardData {
  const ctx = useContext(ExecutiveDashboardDataContext);

  if (ctx === undefined) {
    throw new Error("useExecutiveDashboardData must be used within ExecutiveDashboardDataProvider");
  }

  return ctx;
}
