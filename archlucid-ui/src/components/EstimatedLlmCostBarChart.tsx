import type { ReactNode } from "react";

import type { LlmCostDailyBucket } from "@/lib/llm-cost-reporting";

export type EstimatedLlmCostBarChartProps = {
  daily: LlmCostDailyBucket[];
  currencyCode: string;
};

function formatBucketLabel(isoUtc: string): string {
  const d = new Date(isoUtc);

  if (Number.isNaN(d.getTime())) {
    return "—";
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

/**
 * Inline bar chart (no external chart lib) — estimated LLM cost height per day; aligns with {@link ComplianceDriftChart}.
 */
export function EstimatedLlmCostBarChart(props: EstimatedLlmCostBarChartProps): ReactNode {
  const { daily, currencyCode } = props;

  if (daily.length === 0) {
    return (
      <p className="text-sm text-neutral-600 dark:text-neutral-400">No cost data for this period.</p>
    );
  }

  const maxCost = Math.max(...daily.map((d) => d.estimatedCostUsd), 0.01);
  const barMaxPx = 120;

  return (
    <div
      className="flex gap-1 border-b border-neutral-200 pb-1 dark:border-neutral-700"
      role="img"
      aria-label="Estimated LLM cost by day: bar height shows estimated spend per day in the selected currency"
    >
      {daily.map((point) => {
        const barPx =
          point.estimatedCostUsd === 0 ? 0 : Math.max(2, (point.estimatedCostUsd / maxCost) * barMaxPx);
        const usdLabel = formatEstimatedUsd(point.estimatedCostUsd, currencyCode);
        const title = `Estimated cost ${usdLabel} — prompt ${point.promptTokens.toLocaleString()} tok, completion ${point.completionTokens.toLocaleString()} tok`;

        return (
          <div
            key={point.bucketUtc}
            className="flex min-h-[144px] min-w-0 flex-1 flex-col items-center justify-end gap-1"
          >
            <div
              className="w-full max-w-[2rem] rounded-t bg-teal-700/90 dark:bg-teal-500/90"
              style={{ height: barPx }}
              title={title}
            />
            <span className="truncate text-[10px] text-neutral-500 dark:text-neutral-400">
              {formatBucketLabel(point.bucketUtc)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
