import type { LlmCostDailyBucket } from "@/lib/llm-cost-reporting";

import type { AiUsageDailyMetric } from "./ai-usage-dashboard-model-types";

export function dailyMetricValue(bucket: LlmCostDailyBucket, metric: AiUsageDailyMetric): number {
  switch (metric) {
    case "cost":
      return bucket.estimatedCostUsd;
    case "tokens":
      return bucket.promptTokens + bucket.completionTokens;
    case "operations":
      return bucket.promptTokens > 0 || bucket.completionTokens > 0 ? 1 : 0;
    case "requests":
      return bucket.estimatedCostUsd > 0 ? 1 : 0;
    default: {
      const never: never = metric;
      return never;
    }
  }
}

/** Fixed `en-US` grouping so the screen-reader summary matches between server render and hydration. */
function formatMetricCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatUsd(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `$${value.toFixed(2)}`;
  }
}

export function dailyMetricAccessibleSummary(
  daily: readonly LlmCostDailyBucket[],
  metric: AiUsageDailyMetric,
  currency: string,
): string {
  if (daily.length === 0) {
    return "No daily usage data for the selected period.";
  }

  const values = daily.map((bucket) => dailyMetricValue(bucket, metric));
  const total = values.reduce((sum, value) => sum + value, 0);
  const peak = Math.max(...values);
  const peakIndex = values.indexOf(peak);
  const peakDay = daily[peakIndex]?.bucketUtc ?? "";

  if (metric === "cost") {
    return `Daily estimated cost over ${daily.length} days totals ${formatUsd(total, currency)} with a peak of ${formatUsd(peak, currency)}.`;
  }

  if (metric === "tokens") {
    return `Daily token usage over ${daily.length} days totals ${formatMetricCount(total)} tokens with a peak day of ${formatMetricCount(peak)} tokens${peakDay.length > 0 ? ` on ${peakDay.slice(0, 10)}` : ""}.`;
  }

  return `Daily ${metric} over ${daily.length} days totals ${formatMetricCount(total)} with a peak of ${formatMetricCount(peak)}.`;
}

export function formatAiUsageRemainingBudgetCopy(remainingUsd: number, totalUsd: number): string {
  return `$${remainingUsd.toFixed(2)} remaining of $${totalUsd.toFixed(2)}`;
}

export function formatAiUsageUsedBudgetCopy(usedUsd: number, totalUsd: number): string {
  return `$${usedUsd.toFixed(2)} used of $${totalUsd.toFixed(2)}`;
}
