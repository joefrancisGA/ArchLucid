import type { LlmCostDailyBucket, LlmCostReportingDashboard } from "@/lib/llm-cost-reporting";

export type LlmCostCommandCenterSummary = {
  readonly utcMonthEstimatedUsd: number;
  readonly utcMonthPromptTokens: number;
  readonly utcMonthCompletionTokens: number;
  readonly utcTodayEstimatedUsd: number | null;
  readonly utcTodayPromptTokens: number | null;
  readonly utcTodayCompletionTokens: number | null;
  readonly topWorkspaceProjectLabel: string | null;
  readonly topWorkspaceProjectEstimatedUsd: number | null;
  readonly topExpensiveRunId: string | null;
  readonly topExpensiveRunEstimatedUsd: number | null;
};

function utcDateKey(iso: string): string | null {
  const parsed = Date.parse(iso);

  if (!Number.isFinite(parsed))
    return null;

  const date = new Date(parsed);

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function sumBuckets(buckets: readonly LlmCostDailyBucket[]): {
  estimatedUsd: number;
  promptTokens: number;
  completionTokens: number;
} {
  return buckets.reduce(
    (acc, bucket) => ({
      estimatedUsd: acc.estimatedUsd + bucket.estimatedCostUsd,
      promptTokens: acc.promptTokens + bucket.promptTokens,
      completionTokens: acc.completionTokens + bucket.completionTokens,
    }),
    { estimatedUsd: 0, promptTokens: 0, completionTokens: 0 },
  );
}

/** Rolls up tenant LLM cost reporting into UTC month/today command-center figures (assessment #14). */
export function buildLlmCostCommandCenterSummary(
  dashboard: LlmCostReportingDashboard | null,
): LlmCostCommandCenterSummary | null {
  if (dashboard === null || dashboard.daily.length === 0)
    return null;

  const now = new Date();
  const monthPrefix = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const todayKey = utcDateKey(now.toISOString());

  const monthBuckets = dashboard.daily.filter((bucket) => {
    const key = utcDateKey(bucket.bucketUtc);

    return key !== null && key.startsWith(monthPrefix);
  });

  const monthTotals = sumBuckets(monthBuckets.length > 0 ? monthBuckets : dashboard.daily);

  const todayBucket = dashboard.daily.find((bucket) => utcDateKey(bucket.bucketUtc) === todayKey) ?? null;

  const topRow = [...dashboard.byWorkspaceProject].sort(
    (left, right) => right.estimatedCostUsd - left.estimatedCostUsd,
  )[0];

  const topRun = [...dashboard.topRuns].sort(
    (left, right) => right.estimatedCostUsd - left.estimatedCostUsd,
  )[0];

  return {
    utcMonthEstimatedUsd: monthTotals.estimatedUsd,
    utcMonthPromptTokens: monthTotals.promptTokens,
    utcMonthCompletionTokens: monthTotals.completionTokens,
    utcTodayEstimatedUsd: todayBucket?.estimatedCostUsd ?? null,
    utcTodayPromptTokens: todayBucket?.promptTokens ?? null,
    utcTodayCompletionTokens: todayBucket?.completionTokens ?? null,
    topWorkspaceProjectLabel:
      topRow !== undefined ? `${topRow.workspaceName} / ${topRow.projectName}` : null,
    topWorkspaceProjectEstimatedUsd: topRow?.estimatedCostUsd ?? null,
    topExpensiveRunId: topRun?.runId ?? null,
    topExpensiveRunEstimatedUsd: topRun?.estimatedCostUsd ?? null,
  };
}
