import { cn } from "@/lib/utils";
import Link from "next/link";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { LlmCostDailyBucket } from "@/lib/llm-cost-reporting";
import { hasLlmUsageInDailyBuckets } from "@/lib/llm-cost-reporting-display-labels";

export type EstimatedLlmCostBarChartProps = {
  daily: LlmCostDailyBucket[];
  currencyCode: string;
};

function formatBucketLabel(isoUtc: string): string {
  const d = new Date(isoUtc);

  if (Number.isNaN(d.getTime())) {
    return " — ";
  }

  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");

  return `${month}/${day}`;
}

function formatEstimatedUsd(value: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currencyCode}`;
  }
}

function DailyUsageEmptyState(): ReactNode {
  return (
    <div
      className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center dark:border-neutral-700 dark:bg-neutral-900/30"
      data-testid="llm-daily-usage-empty"
    >
      <h3 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
        No AI usage in the last 30 days
      </h3>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Usage will appear here after users run AI-assisted review, evidence, or Q&amp;A workflows.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/insights/ask-review-questions">Open review questions</Link>
        </Button>
        <Button asChild variant="primary" size="sm">
          <Link href="/architecture/reviews/new">Start a review</Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * Inline bar chart (no external chart lib) — estimated LLM cost height per day; aligns with {@link ComplianceDriftChart}.
 */
export function EstimatedLlmCostBarChart(props: EstimatedLlmCostBarChartProps): ReactNode {
  const { daily, currencyCode } = props;

  if (daily.length === 0 || !hasLlmUsageInDailyBuckets(daily)) {
    return <DailyUsageEmptyState />;
  }

  const maxCost = Math.max(...daily.map((d) => d.estimatedCostUsd), 0.01);
  const barMaxPx = 120;

  return (
    <div
      className="flex gap-1 border-b border-neutral-200 pb-1 dark:border-neutral-700"
      role="img"
      aria-label="Daily AI usage trend for the last 30 days"
    >
      {daily.map((point) => {
        const barPx =
          point.estimatedCostUsd === 0 ? 0 : Math.max(2, (point.estimatedCostUsd / maxCost) * barMaxPx);
        const usdLabel = formatEstimatedUsd(point.estimatedCostUsd, currencyCode);
        const barAriaLabel = `Estimated cost ${usdLabel} — prompt ${point.promptTokens.toLocaleString()} tok, completion ${point.completionTokens.toLocaleString()} tok`;

        return (
          <div
            key={point.bucketUtc}
            className="flex min-h-[144px] min-w-0 flex-1 flex-col items-center justify-end gap-1"
            tabIndex={0}
            aria-label={barAriaLabel}
          >
            <div
              className="w-full max-w-[2rem] rounded-t bg-teal-700/90 dark:bg-teal-500/90"
              style={{ height: barPx }}
            />
            <span className={cn("truncate text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.badge)}>
              {formatBucketLabel(point.bucketUtc)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
