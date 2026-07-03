"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useComplianceDriftTrendQuery } from "@/hooks/use-compliance-drift-trend-query";
import { useExecutiveRoiSummaryQuery } from "@/hooks/use-executive-roi-summary-query";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

export type ExecutiveDashboardData = {
  summary: ExecutiveRoiSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  driftPoints: ComplianceDriftTrendPoint[];
  driftLoading: boolean;
  driftError: boolean;
};

const ExecutiveDashboardDataContext = createContext<ExecutiveDashboardData | undefined>(undefined);

/** Fetches executive-summary and compliance-drift once; children read via `useExecutiveDashboardData()`. */
export function ExecutiveDashboardDataProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const summaryQuery = useExecutiveRoiSummaryQuery();
  const driftQuery = useComplianceDriftTrendQuery();

  const summary = summaryQuery.data ?? null;
  const summaryLoading =
    summaryQuery.isPending ||
    summaryQuery.isFetching ||
    (summary === null && !summaryQuery.isFetched);
  const summaryError =
    summaryQuery.isError
      ? summaryQuery.error instanceof Error
        ? summaryQuery.error.message
        : "Failed to load executive KPIs."
      : null;

  const driftPoints = driftQuery.data ?? [];
  const driftLoading =
    driftQuery.isPending ||
    driftQuery.isFetching ||
    (driftPoints.length === 0 && !driftQuery.isFetched);
  const driftError = driftQuery.isError;

  const value = useMemo<ExecutiveDashboardData>(
    () => ({
      summary,
      summaryLoading,
      summaryError,
      driftPoints,
      driftLoading,
      driftError,
    }),
    [summary, summaryLoading, summaryError, driftPoints, driftLoading, driftError],
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
