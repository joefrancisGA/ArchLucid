"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import {
  type ExecutiveTimeRange,
  filterHistoryPointsByRange,
} from "@/lib/executive-time-range";
import { BUYER_EXECUTIVE_DATA_SOURCE_NOTE } from "@/lib/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

import { ExecutiveRoiSavingsTrendSvgChart } from "./ExecutiveRoiSavingsTrendSvgChart";

type HistoryPoint = {
  snapshotUtc: string;
  totalEstimatedUsdSavings: number;
  criticalSecurityFindings: number;
  realRunCount: number;
  simulatorRunCount: number;
  realModeSavingsUsd: number;
  isMixedMode: boolean;
};

function formatMonth(isoUtc: string): string {
  const date = new Date(isoUtc);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });
}

function chartIncludesMixedMode(points: HistoryPoint[]): boolean {
  return points.some((point) => point.isMixedMode);
}

function buildCriticalBarTitle(point: HistoryPoint): string {
  const monthLabel = formatMonth(point.snapshotUtc);

  return `${point.criticalSecurityFindings} critical findings — ${monthLabel} · ${point.realRunCount} Real · ${point.simulatorRunCount} Simulator`;
}

function isSimulatorOnlyPeriod(point: HistoryPoint): boolean {
  return point.realRunCount === 0 && point.simulatorRunCount > 0;
}

export type ExecutiveRoiTrendSectionProps = {
  readonly defaultTimeRange?: ExecutiveTimeRange;
  readonly showTimeRangeSelector?: boolean;
};

function trendRangeLabel(range: ExecutiveTimeRange): string {
  if (range === "30d") {
    return "last 30 days";
  }

  if (range === "quarter") {
    return "last quarter";
  }

  if (range === "year") {
    return "last year";
  }

  return "all available months";
}

/** Executive ROI savings and critical-finding trend chart (API returns ~6 months; UI can filter). */
export function ExecutiveRoiTrendSection({
  defaultTimeRange = "quarter",
  showTimeRangeSelector = false,
}: ExecutiveRoiTrendSectionProps) {
  const [allPoints, setAllPoints] = useState<HistoryPoint[]>([]);
  const [timeRange, setTimeRange] = useState<ExecutiveTimeRange>(defaultTimeRange);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(
          `/api/proxy/${ApiV1Routes.roiExecutiveSummary}/history`,
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const json = (await response.json()) as { points?: HistoryPoint[] };

        if (!cancelled) {
          setAllPoints(json.points ?? []);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const points = useMemo(
    () => filterHistoryPointsByRange(allPoints, timeRange),
    [allPoints, timeRange],
  );

  const maxCritical = Math.max(...points.map((point) => point.criticalSecurityFindings), 1);
  const showMixedModeFootnote = chartIncludesMixedMode(points);
  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base">ROI trend ({trendRangeLabel(timeRange)})</CardTitle>
            <CardDescription className="text-xs">
              {buyerPolished
                ? `Estimated USD savings and critical security findings over time. ${BUYER_EXECUTIVE_DATA_SOURCE_NOTE}`
                : (
                    <>
                      Estimated USD savings and critical security findings over time from{" "}
                      <span className="font-mono">GET /v1/roi/executive-summary/history</span>.
                    </>
                  )}
            </CardDescription>
          </div>
          {showTimeRangeSelector ? (
            <div className="shrink-0">
              <label htmlFor="exec-roi-trend-range" className="mb-1 block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Time range
              </label>
              <select
                id="exec-roi-trend-range"
                data-testid="exec-roi-trend-time-range"
                className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100"
                value={timeRange}
                onChange={(event) => setTimeRange(event.target.value as ExecutiveTimeRange)}
              >
                <option value="30d">Last 30 days</option>
                <option value="quarter">Last quarter</option>
                <option value="year">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">Loading ROI trend…</p>
        ) : null}
        {!loading && error ? (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400" role="alert">
            ROI trend is unavailable right now.
          </p>
        ) : null}
        {!loading && !error && points.length === 0 ? (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
            Commit architecture reviews to populate longitudinal ROI trends.
          </p>
        ) : null}
        {!loading && !error && points.length > 0 ? (
          <div className="space-y-4" data-testid="exec-roi-trend-chart">
            <ExecutiveRoiSavingsTrendSvgChart
              points={points.map((point) => ({
                snapshotUtc: point.snapshotUtc,
                totalEstimatedUsdSavings: point.totalEstimatedUsdSavings,
              }))}
            />
            <div>
              <div className="mb-2 text-xs font-medium text-neutral-600 dark:text-neutral-400">Critical security findings</div>
              <div className="flex items-end gap-2">
                {points.map((point) => (
                  <div key={`critical-${point.snapshotUtc}`} className="flex flex-1 flex-col items-center gap-1">
                    {isSimulatorOnlyPeriod(point) && !buyerPolished ? (
                      <StatusTag
                        kind="needs-attention"
                        label="Simulator-only"
                        className="text-[9px] px-1 py-0"
                        data-testid="exec-roi-trend-simulator-only"
                      />
                    ) : null}
                    <div
                      className="w-full rounded-sm bg-amber-500/80"
                      style={{ height: `${Math.max(8, Math.round((point.criticalSecurityFindings / maxCritical) * 120))}px` }}
                      title={buildCriticalBarTitle(point)}
                    />
                    <span className="text-[10px] text-neutral-500">{formatMonth(point.snapshotUtc)}</span>
                  </div>
                ))}
              </div>
            </div>
            {showMixedModeFootnote && !buyerPolished ? (
              <p
                className="m-0 text-xs text-neutral-600 dark:text-neutral-400"
                data-testid="exec-roi-trend-mixed-mode-footnote"
              >
                Chart includes both Real and Simulator runs. Hover savings bars for exact monthly savings.
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
