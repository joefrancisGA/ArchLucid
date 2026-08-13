"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshButton } from "@/components/ui/refresh-button";
import type { AiUsageDailyMetric } from "@/lib/ai-usage-dashboard-model";
import {
  dailyMetricAccessibleSummary,
  dailyMetricValue,
} from "@/lib/ai-usage-dashboard-model";
import type { LlmCostDailyBucket } from "@/lib/llm-cost-reporting";
import { hasLlmUsageInDailyBuckets } from "@/lib/llm-cost-reporting-display-labels";
import { formatCostReportingEstimatedUsd } from "@/app/(operator)/administration/ai-usage/_sections/cost-reporting-page-helpers";
import { OPERATOR_CARD, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AiUsageSectionState } from "./AiUsageSectionState";

type Props = {
  readonly daily: readonly LlmCostDailyBucket[];
  readonly currency: string;
  readonly state: import("@/lib/ai-usage-dashboard-model").AiUsageSectionLoadState;
  readonly onRefresh?: () => void;
};

const METRIC_OPTIONS: readonly { readonly id: AiUsageDailyMetric; readonly label: string }[] = [
  { id: "cost", label: "Cost" },
  { id: "tokens", label: "Tokens" },
  { id: "operations", label: "AI operations" },
  { id: "requests", label: "Requests" },
];

function formatBucketLabel(isoUtc: string): string {
  const date = new Date(isoUtc);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}`;
}

function formatMetricValue(metric: AiUsageDailyMetric, value: number, currency: string): string {
  if (metric === "cost") {
    return formatCostReportingEstimatedUsd(value, currency);
  }

  return value.toLocaleString();
}

export function AiUsageDailyUsagePanel(props: Props) {
  const [metric, setMetric] = useState<AiUsageDailyMetric>("cost");
  const hasUsage = hasLlmUsageInDailyBuckets(props.daily);

  const chart = useMemo(() => {
    if (!hasUsage) {
      return null;
    }

    const values = props.daily.map((bucket) => dailyMetricValue(bucket, metric));
    const maxValue = Math.max(...values, metric === "cost" ? 0.01 : 1);
    const barMaxPx = 120;
    const accessibleSummary = dailyMetricAccessibleSummary(props.daily, metric, props.currency);

    return (
      <>
        <p className="sr-only" data-testid="ai-usage-daily-chart-summary">
          {accessibleSummary}
        </p>
        <div
          className="flex gap-1 border-b border-neutral-200 pb-1 dark:border-neutral-700"
          role="img"
          aria-label={accessibleSummary}
        >
          {props.daily.map((point, index) => {
            const value = values[index] ?? 0;
            const barPx = value === 0 ? 0 : Math.max(2, (value / maxValue) * barMaxPx);
            const isSpike = value === maxValue && value > 0;
            const title = `${formatBucketLabel(point.bucketUtc)}: ${formatMetricValue(metric, value, props.currency)}`;

            return (
              <div
                key={point.bucketUtc}
                className="flex min-h-[144px] min-w-0 flex-1 flex-col items-center justify-end gap-1"
                tabIndex={0}
                aria-label={title}
              >
                <div
                  className={cn(
                    "w-full max-w-[2rem] rounded-t",
                    isSpike ? "bg-amber-600/90 dark:bg-amber-400/90" : "bg-teal-700/90 dark:bg-teal-500/90",
                  )}
                  style={{ height: barPx }}
                />
                <span className={cn("truncate text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.badge)}>
                  {formatBucketLabel(point.bucketUtc)}
                </span>
              </div>
            );
          })}
        </div>
      </>
    );
  }, [hasUsage, metric, props.currency, props.daily]);

  return (
    <Card data-testid="ai-usage-daily-usage-panel">
      <CardHeader className={OPERATOR_CARD.header}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Daily AI usage (last 30 days)</CardTitle>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Rolling 30-day trend for this workspace. Hover or focus bars for daily totals.
            </p>
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Daily usage metric">
            {METRIC_OPTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                size="sm"
                variant={metric === option.id ? "primary" : "outline"}
                aria-pressed={metric === option.id}
                onClick={() => setMetric(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn(OPERATOR_CARD.content, "space-y-3")}>
        <AiUsageSectionState
          state={props.state}
          title="daily usage"
          testId="ai-usage-daily-usage-state"
          emptyTitle="No AI usage in the last 30 days"
          emptyDescription="No AI usage has been recorded for this billing period. Daily totals will appear after reviews, evidence checks, or Q&A workflows run."
          errorMessage="Could not load daily usage reporting."
        >
          {chart}
          {props.onRefresh !== undefined ? (
            <RefreshButton onClick={() => void props.onRefresh?.()} />
          ) : null}
        </AiUsageSectionState>
      </CardContent>
    </Card>
  );
}
