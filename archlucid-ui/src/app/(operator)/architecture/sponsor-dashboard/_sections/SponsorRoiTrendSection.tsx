"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import { SponsorTimeRangeSelect } from "@/components/sponsor/SponsorTimeRangeSelect";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusTag } from "@/components/ui/status-tag";
import {
  type SponsorRoiHistoryPoint,
  useSponsorRoiSummaryHistoryQuery,
} from "@/hooks/use-sponsor-roi-summary-history-query";
import {
  type SponsorTimeRange,
  filterHistoryPointsByRange,
} from "@/lib/sponsor/sponsor-time-range";
import { BUYER_SPONSOR_DATA_SOURCE_NOTE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_KPI_CARD_DESCRIPTION, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { EXECUTION_MODE_ROI_PERIOD_MIX_FOOTNOTE, resolveExecutiveTrendSavingsUsd, resolveSponsorTrendSavingsUsd } from "@/lib/execution-mode-honesty";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { RULE_BASED_ANALYSIS_ONLY_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";

import { SponsorRoiSavingsTrendSvgChart } from "./SponsorRoiSavingsTrendSvgChart";

type HistoryPoint = SponsorRoiHistoryPoint;

function normalizedTrendPoint(point: HistoryPoint) {
  return {
    snapshotUtc: point.snapshotUtc ?? "",
    totalEstimatedUsdSavings: Number(point.totalEstimatedUsdSavings ?? 0),
    realModeSavingsUsd: Number(point.realModeSavingsUsd ?? 0),
    realRunCount: point.realRunCount ?? 0,
    simulatorRunCount: point.simulatorRunCount ?? 0,
    criticalSecurityFindings: point.criticalSecurityFindings ?? 0,
    isMixedMode: point.isMixedMode ?? false,
  };
}

function formatMonth(isoUtc: string): string {
  const date = new Date(isoUtc);

  if (Number.isNaN(date.getTime())) {
    return " — ";
  }

  return date.toLocaleDateString(undefined, { month: "short", year: "2-digit", timeZone: "UTC" });
}

function chartIncludesMixedMode(points: HistoryPoint[]): boolean {
  return points.some((point) => normalizedTrendPoint(point).isMixedMode);
}

function buildCriticalBarTitle(point: HistoryPoint, buyerPolished: boolean): string {
  const normalized = normalizedTrendPoint(point);
  const monthLabel = formatMonth(normalized.snapshotUtc);

  if (buyerPolished) {
    return `${normalized.criticalSecurityFindings} critical findings — ${monthLabel}`;
  }

  return `${normalized.criticalSecurityFindings} critical findings — ${monthLabel} · ${normalized.realRunCount} Real · ${normalized.simulatorRunCount} Simulator`;
}

function isSimulatorOnlyPeriod(point: HistoryPoint): boolean {
  const normalized = normalizedTrendPoint(point);

  return normalized.realRunCount === 0 && normalized.simulatorRunCount > 0;
}

export type SponsorRoiTrendSectionProps = {
  readonly defaultTimeRange?: SponsorTimeRange;
  readonly showTimeRangeSelector?: boolean;
};

function trendRangeLabel(range: SponsorTimeRange): string {
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

/** Sponsor ROI savings and critical-finding trend chart (API returns ~6 months; UI can filter). */
export function SponsorRoiTrendSection({
  defaultTimeRange = "quarter",
  showTimeRangeSelector = false,
}: SponsorRoiTrendSectionProps) {
  const [timeRange, setTimeRange] = useState<SponsorTimeRange>(defaultTimeRange);
  const historyQuery = useSponsorRoiSummaryHistoryQuery();
  const allPoints: HistoryPoint[] = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
  const loading = historyQuery.isPending;
  const error = historyQuery.isError;

  const points = useMemo(() => {
    const withSnapshotUtc = allPoints.filter(
      (point): point is HistoryPoint & { snapshotUtc: string } =>
        typeof point.snapshotUtc === "string" && point.snapshotUtc.length > 0,
    );

    return filterHistoryPointsByRange(withSnapshotUtc, timeRange);
  }, [allPoints, timeRange]);

  const maxCritical = Math.max(...points.map((point) => normalizedTrendPoint(point).criticalSecurityFindings), 1);
  const showMixedModeFootnote = chartIncludesMixedMode(points);
  const buyerPolished = isBuyerPolishedOperatorShellEnv();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>ROI trend ({trendRangeLabel(timeRange)})</CardTitle>
            <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
              {`Estimated USD savings and critical security findings over time. ${BUYER_SPONSOR_DATA_SOURCE_NOTE}`}
            </CardDescription>
          </div>
          {showTimeRangeSelector ? (
            <SponsorTimeRangeSelect
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
            <SponsorRoiSavingsTrendSvgChart
              points={points.map((point) => {
                const normalized = normalizedTrendPoint(point);

                return {
                  snapshotUtc: normalized.snapshotUtc,
                  totalEstimatedUsdSavings: resolveExecutiveTrendSavingsUsd(normalized, buyerPolished),
                };
              })}
            />
            <div>
              <div className={cn("mb-2 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Critical security findings</div>
              <div className="flex items-end gap-2">
                {points.map((point) => {
                  const normalized = normalizedTrendPoint(point);
                  const criticalBarLabel = buildCriticalBarTitle(point, buyerPolished);

                  return (
                  <div
                    key={`critical-${normalized.snapshotUtc}`}
                    className="flex flex-1 flex-col items-center gap-1"
                    tabIndex={0}
                    aria-label={criticalBarLabel}
                  >
                    {isSimulatorOnlyPeriod(point) ? (
                      <StatusTag
                        kind="needs-attention"
                        label={buyerPolished ? RULE_BASED_ANALYSIS_ONLY_BUYER_LABEL : "Simulator-only"}
                        className="text-[9px] px-1 py-0"
                        data-testid="exec-roi-trend-simulator-only"
                      />
                    ) : null}
                    <div
                      className="w-full rounded-sm bg-amber-500/80"
                      style={{ height: `${Math.max(8, Math.round((normalized.criticalSecurityFindings / maxCritical) * 120))}px` }}
                    />
                    <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.navHelper)}>{formatMonth(normalized.snapshotUtc)}</span>
                  </div>
                  );
                })}
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
