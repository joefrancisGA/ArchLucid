"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useSponsorDashboardBundleQuery } from "@/hooks/use-sponsor-dashboard-bundle-query";
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

/** Loads sponsor dashboard bundle once; children read via `useSponsorDashboardData()`. */
export function SponsorDashboardDataProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const queryClient = useQueryClient();
  const bundleQuery = useSponsorDashboardBundleQuery();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const summary = bundleQuery.data?.sponsorReport ?? null;
  const summaryLoading =
    bundleQuery.isPending ||
    (summary === null && !bundleQuery.isFetched);
  const summaryError =
    bundleQuery.isError
      ? bundleQuery.error instanceof Error
        ? bundleQuery.error.message
        : "Failed to load sponsor KPIs."
      : null;

  const driftPoints = useMemo(
    () => bundleQuery.data?.complianceDriftTrend ?? [],
    [bundleQuery.data?.complianceDriftTrend],
  );
  const driftLoading =
    bundleQuery.isPending ||
    bundleQuery.isFetching ||
    (driftPoints.length === 0 && !bundleQuery.isFetched);
  const driftError = bundleQuery.isError;

  useEffect(() => {
    if (bundleQuery.isFetched && lastRefreshedAt === null) {
      setLastRefreshedAt(new Date());
    }
  }, [bundleQuery.isFetched, lastRefreshedAt]);

  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);

    try {
      await queryClient.invalidateQueries({ queryKey: operatorQueryKeys.sponsorDashboardBundle });
      await queryClient.refetchQueries({ queryKey: operatorQueryKeys.sponsorDashboardBundle });
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
