"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { useExecutiveRoiSummaryQuery } from "@/hooks/use-executive-roi-summary-query";
import { getComplianceDriftTrend } from "@/lib/api";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

export type ExecutiveDashboardData = {  summary: ExecutiveRoiSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  driftPoints: ComplianceDriftTrendPoint[];
  driftLoading: boolean;
  driftError: boolean;
};

const ExecutiveDashboardDataContext = createContext<ExecutiveDashboardData | undefined>(undefined);

function rollingBounds30Days(): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - 30);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

/** Fetches executive-summary and compliance-drift once; children read via `useExecutiveDashboardData()`. */
export function ExecutiveDashboardDataProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const summaryQuery = useExecutiveRoiSummaryQuery();
  const summary = summaryQuery.data ?? null;
  const summaryLoading = summaryQuery.isPending;
  const summaryError =
    summaryQuery.isError
      ? summaryQuery.error instanceof Error
        ? summaryQuery.error.message
        : "Failed to load executive KPIs."
      : null;

  const [driftPoints, setDriftPoints] = useState<ComplianceDriftTrendPoint[]>([]);
  const [driftLoading, setDriftLoading] = useState(true);
  const [driftError, setDriftError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const bounds = rollingBounds30Days();

    void (async () => {
      try {
        const data = await getComplianceDriftTrend(bounds.fromUtc, bounds.toUtc, 1440);

        if (!cancelled) {
          setDriftPoints(data);
        }
      } catch {
        if (!cancelled) {
          setDriftError(true);
        }
      } finally {
        if (!cancelled) {
          setDriftLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ExecutiveDashboardDataContext.Provider
      value={{ summary, summaryLoading, summaryError, driftPoints, driftLoading, driftError }}
    >
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
