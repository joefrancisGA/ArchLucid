"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import { ExecutiveTimeRangeSelect } from "@/components/executive/ExecutiveTimeRangeSelect";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusTag } from "@/components/ui/status-tag";
import {
  type ExecutiveRoiHistoryPoint,
  useExecutiveRoiSummaryHistoryQuery,
} from "@/hooks/use-executive-roi-summary-history-query";
import {
  type ExecutiveTimeRange,
  filterHistoryPointsByRange,
} from "@/lib/executive/executive-time-range";
import { BUYER_EXECUTIVE_DATA_SOURCE_NOTE } from "@/lib/buyer/buyer-polish-copy";
import { EXECUTION_MODE_ROI_PERIOD_MIX_FOOTNOTE, resolveExecutiveTrendSavingsUsd } from "@/lib/execution-mode-honesty";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_KPI_CARD_DESCRIPTION, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ExecutiveRoiSavingsTrendSvgChart } from "./ExecutiveRoiSavingsTrendSvgChart";

type HistoryPoint = ExecutiveRoiHistoryPoint;

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

function buildCriticalBarTitle(point: HistoryPoint, buyerPolished: boolean): string {
  const monthLabel = formatMonth(point.snapshotUtc);

  if (buyerPolished) {
    return `${point.criticalSecurityFindings} critical findings — ${monthLabel}`;
  }

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
  const [timeRange, setTimeRange] = useState<ExecutiveTimeRange>(defaultTimeRange);
  const historyQuery = useExecutiveRoiSummaryHistoryQuery();
  const allPoints: HistoryPoint[] = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
  const loading = historyQuery.isPending;
  const error = historyQuery.isError;

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
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>ROI trend ({trendRangeLabel(timeRange)})</CardTitle>
            <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
              {`Estimated USD savings and critical security findings over time. ${BUYER_EXECUTIVE_DATA_SOURCE_NOTE}`}
            </CardDescription>
          </div>
          {showTimeRangeSelector ? (
            <ExecutiveTimeRangeSelect
              id="exec-roi-trend-range"
              value={timeRange}
              onValueChange={setTimeRange}
              triggerTestId="exec-roi-trend-time-range"
            />
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div
            aria-busy="true"
            aria-label="Loading ROI trend"
            className="space-y-3"
            data-testid="exec-roi-trend-loading-skeleton"
            role="status"
          >
            <span className="sr-only">Loading ROI trend…</span>
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : null}
        {!loading && error ? (
          <OperatorSectionLoadFailure
            message="ROI trend is unavailable right now."
            retrying={historyQuery.isFetching}
            testId="exec-roi-trend-load-failure"
            onRetry={() => void historyQuery.refetch()}
          />
        ) : null}
        {!loading && !error && points.length === 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Commit architecture reviews to populate longitudinal ROI trends.
          </p>
        ) : null}
        {!loading && !error && points.length > 0 ? (
          <div className="space-y-4" data-testid="exec-roi-trend-chart">
            <ExecutiveRoiSavingsTrendSvgChart
              points={points.map((point) => ({
                snapshotUtc: point.snapshotUtc,
                totalEstimatedUsdSavings: resolveExecutiveTrendSavingsUsd(point, buyerPolished),
              }))}
            />
            <div>
              <div className={cn("mb-2 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Critical security findings</div>
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
                      title={buildCriticalBarTitle(point, buyerPolished)}
                    />
                    <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.navHelper)}>{formatMonth(point.snapshotUtc)}</span>
                  </div>
                ))}
              </div>
            </div>
            {showMixedModeFootnote && !buyerPolished ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="exec-roi-trend-mixed-mode-footnote"
              >
                {EXECUTION_MODE_ROI_PERIOD_MIX_FOOTNOTE} Hover savings bars for exact monthly savings.
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
