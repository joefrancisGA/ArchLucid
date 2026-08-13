"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useComplianceDriftTrendQuery } from "@/hooks/use-compliance-drift-trend-query";
import { useSponsorRoiSummaryQuery } from "@/hooks/use-sponsor-roi-summary-query";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

export type SponsorDashboardData = {
  summary: SponsorRoiSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  driftPoints: ComplianceDriftTrendPoint[];
  driftLoading: boolean;
  driftError: boolean;
  refreshing: boolean;
  lastRefreshedAt: Date | null;
  refreshDashboard: () => Promise<void>;
};

const SponsorDashboardDataContext = createContext<SponsorDashboardData | undefined>(undefined);

/** Fetches sponsor-report and compliance-drift once; children read via `useSponsorDashboardData()`. */
export function SponsorDashboardDataProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const queryClient = useQueryClient();
  const summaryQuery = useSponsorRoiSummaryQuery();
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
        : "Failed to load sponsor KPIs."
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
        queryClient.invalidateQueries({ queryKey: operatorQueryKeys.sponsorRoiSummary }),
        queryClient.invalidateQueries({ queryKey: operatorQueryKeys.complianceDriftTrend30d }),
      ]);
      await Promise.all([
        queryClient.refetchQueries({ queryKey: operatorQueryKeys.sponsorRoiSummary }),
        queryClient.refetchQueries({ queryKey: operatorQueryKeys.complianceDriftTrend30d }),
      ]);
      setLastRefreshedAt(new Date());
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const value = useMemo<SponsorDashboardData>(
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
    <SponsorDashboardDataContext.Provider value={value}>
      {children}
    </SponsorDashboardDataContext.Provider>
  );
}

/** Must be called inside `SponsorDashboardDataProvider`. */
export function useSponsorDashboardData(): SponsorDashboardData {
  const ctx = useContext(SponsorDashboardDataContext);

  if (ctx === undefined) {
    throw new Error("useSponsorDashboardData must be used within SponsorDashboardDataProvider");
  }

  return ctx;
}
