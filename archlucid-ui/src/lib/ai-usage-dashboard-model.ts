import type { AdminAiUsageDashboard } from "@/lib/admin-ai-usage-dashboard";
import type { AiUsageBreakdownGroupBy } from "@/lib/ai-usage-dashboard-filters";
import { buildLlmCostCommandCenterSummary } from "@/lib/llm-cost-command-center-summary";
import type { LlmCostDailyBucket, LlmCostReportingDashboard } from "@/lib/llm-cost-reporting";
import { hasLlmUsageInDailyBuckets } from "@/lib/llm-cost-reporting-display-labels";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";
import {
  llmBudgetUtilizationPercent,
  resolveLlmBudgetUtilizationTone,
} from "@/lib/llm-monthly-budget-status";

import {
  formatAiUsageFeatureLabel,
  mapAiUsageActivityRow,
  matchesAiUsageActivityFilters,
} from "./ai-usage-dashboard-model-activity";

export type {
  AiUsageSectionLoadState,
  AiUsageBudgetPaceStatus,
  AiUsageActivityBadge,
  AiUsageActivityStatus,
  AiUsageDailyMetric,
  AiUsageKpiSummary,
  AiUsageBreakdownRow,
  AiUsageActivityRow,
  AiUsageGovernanceControls,
  AiUsageFreshness,
  AiUsageDashboardDerived,
  BuildAiUsageDashboardDerivedInput,
} from "./ai-usage-dashboard-model-types";

export {
  buildAiUsageActivityCsv,
  formatAiUsageFeatureLabel,
  inferAiUsageActivityBadge,
  inferAiUsageActivityStatus,
} from "./ai-usage-dashboard-model-activity";

import type {
  AiUsageBreakdownRow,
  AiUsageBudgetPaceStatus,
  AiUsageDashboardDerived,
  AiUsageDailyMetric,
  AiUsageGovernanceControls,
  AiUsageSectionLoadState,
  BuildAiUsageDashboardDerivedInput,
} from "./ai-usage-dashboard-model-types";

function utcDaysInMonth(reference: Date): number {
  return new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 0)).getUTCDate();
}

function utcDaysRemainingInMonth(reference: Date): number {
  const daysInMonth = utcDaysInMonth(reference);
  const dayOfMonth = reference.getUTCDate();

  return Math.max(0, daysInMonth - dayOfMonth);
}

/** First instant of the UTC month after `yyyy-MM` (budget period reset). */
export function resolveUtcMonthPeriodResetUtc(utcMonth: string): string | null {
  const match = /^(\d{4})-(\d{2})$/.exec(utcMonth.trim());

  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isFinite(year) || month < 1 || month > 12) {
    return null;
  }

  const reset = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));

  return reset.toISOString();
}

export function formatAiUsageBillingPeriodResetLabel(resetUtc: string): string {
  const date = new Date(resetUtc);

  if (!Number.isFinite(date.getTime())) {
    return "Next UTC month";
  }

  return date.toLocaleDateString(undefined, { dateStyle: "long", timeZone: "UTC" });
}

export function formatAiUsageEstimatesAsOfLabel(asOfUtc: string): string {
  const date = new Date(asOfUtc);

  if (!Number.isFinite(date.getTime())) {
    return "Estimates as of —";
  }

  const formatted = date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });

  return `Estimates as of ${formatted} UTC`;
}

export function resolveAiUsageEstimatesAsOfUtc(
  sources: readonly (string | null | undefined)[],
): string | null {
  for (const source of sources) {
    if (typeof source === "string" && source.trim().length > 0) {
      return source.trim();
    }
  }

  return null;
}

/** Linear month-end projection from month-to-date spend (labeled approximate in UI). */
export function projectMonthEndSpendUsd(usedUsd: number, reference: Date = new Date()): number {
  const dayOfMonth = reference.getUTCDate();

  if (dayOfMonth <= 0 || usedUsd <= 0) {
    return usedUsd;
  }

  const daysInMonth = utcDaysInMonth(reference);
  const dailyRate = usedUsd / dayOfMonth;

  return Math.round(dailyRate * daysInMonth * 100) / 100;
}

function sumDailyCost(daily: readonly LlmCostDailyBucket[]): number {
  return daily.reduce((total, bucket) => total + bucket.estimatedCostUsd, 0);
}

function compareRollingHalvesPercent(daily: readonly LlmCostDailyBucket[]): number | null {
  if (daily.length < 4) {
    return null;
  }

  const midpoint = Math.floor(daily.length / 2);
  const priorHalf = daily.slice(0, midpoint);
  const recentHalf = daily.slice(midpoint);
  const priorTotal = sumDailyCost(priorHalf);
  const recentTotal = sumDailyCost(recentHalf);

  if (priorTotal <= 0 && recentTotal <= 0) {
    return null;
  }

  if (priorTotal <= 0) {
    return 100;
  }

  return Math.round(((recentTotal - priorTotal) / priorTotal) * 1000) / 10;
}

function resolveBudgetPaceStatus(input: {
  readonly budgetStatus: LlmMonthlyDollarBudgetStatus | null;
  readonly adminDashboard: AdminAiUsageDashboard | null;
  readonly projectedMonthEndUsd: number | null;
}): { readonly status: AiUsageBudgetPaceStatus; readonly label: string } {
  const { budgetStatus, adminDashboard, projectedMonthEndUsd } = input;

  if (budgetStatus !== null && !budgetStatus.monthlyBudgetMonitoringActive) {
    return { status: "inactive", label: "Budget monitoring is not enabled for this workspace." };
  }

  if (budgetStatus?.blocksAdditionalLlmExecution === true) {
    return { status: "exhausted", label: "Budget exhausted — new AI-assisted workflows may be blocked." };
  }

  const tone = budgetStatus !== null ? resolveLlmBudgetUtilizationTone(budgetStatus) : "ok";

  if (tone === "warn") {
    return { status: "approaching_limit", label: "Approaching limit — usage is near the warning threshold." };
  }

  const budgetCap = adminDashboard?.budgetAmountUsd ?? budgetStatus?.effectiveHardCapUsd ?? null;
  const projected = projectedMonthEndUsd;

  if (projected !== null && budgetCap !== null && budgetCap > 0 && projected > budgetCap * 1.05) {
    return { status: "at_risk", label: "At risk — projected spend may exceed the monthly budget." };
  }

  if (tone === "critical") {
    return { status: "exhausted", label: "Budget exhausted — new AI-assisted workflows may be blocked." };
  }

  return { status: "on_track", label: "On track — spending is within the configured monthly budget." };
}

function paceStatusLabel(status: AiUsageBudgetPaceStatus): string {
  switch (status) {
    case "on_track":
      return "On track";
    case "approaching_limit":
      return "Approaching limit";
    case "at_risk":
      return "At risk";
    case "exhausted":
      return "Budget exhausted";
    case "inactive":
      return "Monitoring inactive";
    default: {
      const never: never = status;
      return never;
    }
  }
}

function buildGovernanceControls(
  adminDashboard: AdminAiUsageDashboard | null,
  budgetStatus: LlmMonthlyDollarBudgetStatus | null,
): AiUsageGovernanceControls | null {
  if (adminDashboard === null && budgetStatus === null) {
    return null;
  }

  const warnFraction = budgetStatus?.warnFraction ?? null;
  const billingPeriodResetUtc =
    budgetStatus?.utcMonth !== undefined && budgetStatus.utcMonth.length > 0
      ? resolveUtcMonthPeriodResetUtc(budgetStatus.utcMonth)
      : null;

  return {
    monthlyBudgetUsd: adminDashboard?.budgetAmountUsd ?? budgetStatus?.effectiveHardCapUsd ?? null,
    warningThresholdPercent: warnFraction !== null ? Math.round(warnFraction * 100) : null,
    hardStopEnabled: adminDashboard?.hardStopEnabled ?? budgetStatus?.blocksAdditionalLlmExecution ?? false,
    resetPeriod: adminDashboard?.resetPeriod ?? null,
    billingPeriodResetLabel:
      billingPeriodResetUtc !== null ? formatAiUsageBillingPeriodResetLabel(billingPeriodResetUtc) : null,
    workspaceKind: adminDashboard?.workspaceKind ?? budgetStatus?.workspaceKind ?? null,
    customerAiProviderConfigured:
      adminDashboard?.customerAiProviderConfigured ?? budgetStatus?.customerAiProviderConfigured ?? false,
  };
}

function buildBreakdownRows(
  groupBy: AiUsageBreakdownGroupBy,
  costReporting: LlmCostReportingDashboard | null,
  adminDashboard: AdminAiUsageDashboard | null,
): AiUsageBreakdownRow[] {
  if (costReporting === null && adminDashboard === null) {
    return [];
  }

  const rows: AiUsageBreakdownRow[] = [];

  if (groupBy === "workspace" || groupBy === "project") {
    const source = costReporting?.byWorkspaceProject ?? [];

    for (const row of source) {
      const name = groupBy === "workspace" ? row.workspaceName : row.projectName;
      const key = groupBy === "workspace" ? row.workspaceId : `${row.workspaceId}:${row.projectId}`;

      rows.push({
        key,
        name,
        usageCount: 1,
        promptTokens: row.promptTokens,
        completionTokens: row.completionTokens,
        estimatedCostUsd: row.estimatedCostUsd,
        percentOfTotal: 0,
        trendPercent: null,
        detailHref: null,
      });
    }
  }

  if (groupBy === "operation" && adminDashboard !== null) {
    for (const [feature, usd] of Object.entries(adminDashboard.usageByFeatureUsd)) {
      rows.push({
        key: feature,
        name: formatAiUsageFeatureLabel(feature),
        usageCount: 1,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: usd,
        percentOfTotal: 0,
        trendPercent: null,
        detailHref: null,
      });
    }
  }

  if (groupBy === "model" && adminDashboard !== null) {
    const grouped = new Map<string, { cost: number; count: number }>();

    for (const event of adminDashboard.recentEvents) {
      const model = event.providerKind.trim().length > 0 ? event.providerKind : "Unknown model";
      const existing = grouped.get(model) ?? { cost: 0, count: 0 };

      grouped.set(model, {
        cost: existing.cost + event.estimatedCostUsd,
        count: existing.count + 1,
      });
    }

    for (const [model, stats] of grouped.entries()) {
      rows.push({
        key: model,
        name: model,
        usageCount: stats.count,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: stats.cost,
        percentOfTotal: 0,
        trendPercent: null,
        detailHref: null,
      });
    }
  }

  if (groupBy === "user" && adminDashboard !== null) {
    const grouped = new Map<string, { cost: number; count: number }>();

    for (const event of adminDashboard.recentEvents) {
      const user = event.userId ?? "System / scheduled";
      const existing = grouped.get(user) ?? { cost: 0, count: 0 };

      grouped.set(user, {
        cost: existing.cost + event.estimatedCostUsd,
        count: existing.count + 1,
      });
    }

    for (const [user, stats] of grouped.entries()) {
      rows.push({
        key: user,
        name: user,
        usageCount: stats.count,
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: stats.cost,
        percentOfTotal: 0,
        trendPercent: null,
        detailHref: null,
      });
    }
  }

  if (groupBy === "run" && costReporting !== null) {
    for (const run of costReporting.topRuns) {
      rows.push({
        key: run.runId,
        name: `Run ${run.runId.slice(0, 8)}…`,
        usageCount: run.llmCallCount,
        promptTokens: run.promptTokens,
        completionTokens: run.completionTokens,
        estimatedCostUsd: run.estimatedCostUsd,
        percentOfTotal: 0,
        trendPercent: null,
        detailHref: `/architecture/reviews/${encodeURIComponent(run.runId)}`,
      });
    }
  }

  const totalCost = rows.reduce((sum, row) => sum + row.estimatedCostUsd, 0);

  return rows
    .map((row) => ({
      ...row,
      percentOfTotal: totalCost > 0 ? Math.round((row.estimatedCostUsd / totalCost) * 1000) / 10 : 0,
    }))
    .sort((left, right) => right.estimatedCostUsd - left.estimatedCostUsd);
}

function resolveCostReportingState(input: BuildAiUsageDashboardDerivedInput): AiUsageSectionLoadState {
  if (input.costReportingLoading && input.costReportingDelayed) {
    return "delayed";
  }

  if (input.costReportingLoading) {
    return "loading";
  }

  if (input.costReportingError) {
    return "error";
  }

  if (input.costReportingDelayed) {
    return "delayed";
  }

  if (input.costReporting === null) {
    return "error";
  }

  if (!hasLlmUsageInDailyBuckets(input.costReporting.daily)
    && !input.costReporting.byWorkspaceProject.some((row) => row.estimatedCostUsd > 0)) {
    return "empty";
  }

  return "ready";
}

function resolveBudgetState(input: BuildAiUsageDashboardDerivedInput): AiUsageSectionLoadState {
  if (!input.canViewBudgetDetails) {
    return "permission_restricted";
  }

  if (input.budgetLoading || input.adminLoading) {
    return "loading";
  }

  if (input.budgetForbidden || input.adminForbidden) {
    return "permission_restricted";
  }

  if (input.budgetError && input.adminError) {
    return "error";
  }

  if (input.budgetStatus !== null && !input.budgetStatus.monthlyBudgetMonitoringActive) {
    return "inactive";
  }

  if (input.budgetStatus === null && input.adminDashboard === null) {
    return "error";
  }

  return "ready";
}

function resolveActivityState(input: BuildAiUsageDashboardDerivedInput): AiUsageSectionLoadState {
  if (!input.canViewBudgetDetails) {
    return "permission_restricted";
  }

  if (input.adminLoading) {
    return "loading";
  }

  if (input.adminForbidden) {
    return "permission_restricted";
  }

  if (input.adminError) {
    return "error";
  }

  if (input.adminDashboard === null || input.adminDashboard.recentEvents.length === 0) {
    return "empty";
  }

  return "ready";
}

/** Derives the AI usage dashboard view model from API payloads and filter state. */
export function buildAiUsageDashboardDerived(input: BuildAiUsageDashboardDerivedInput): AiUsageDashboardDerived {
  const reference = new Date();
  const costSummary = buildLlmCostCommandCenterSummary(input.costReporting);
  const rolling30DayTotalUsd = input.costReporting !== null ? sumDailyCost(input.costReporting.daily) : 0;

  const usedFromAdmin = input.canViewBudgetDetails ? input.adminDashboard?.usedAmountUsd ?? null : null;
  const usedFromCost = costSummary?.utcMonthEstimatedUsd ?? null;
  const usedThisMonthUsd = usedFromAdmin ?? usedFromCost;

  const budgetTotalUsd = input.canViewBudgetDetails
    ? input.adminDashboard?.budgetAmountUsd ?? input.budgetStatus?.effectiveHardCapUsd ?? null
    : null;
  const remainingBudgetUsd = input.canViewBudgetDetails
    ? input.adminDashboard?.remainingAmountUsd ?? input.budgetStatus?.remainingBudgetUsd ?? null
    : null;

  const budgetPercentUsed =
    input.canViewBudgetDetails && input.budgetStatus != null
      ? llmBudgetUtilizationPercent(input.budgetStatus)
      : input.canViewBudgetDetails && budgetTotalUsd !== null && usedThisMonthUsd !== null && budgetTotalUsd > 0
        ? Math.min(100, Math.round((usedThisMonthUsd / budgetTotalUsd) * 1000) / 10)
        : null;

  const projectedMonthEndUsd =
    usedThisMonthUsd !== null ? projectMonthEndSpendUsd(usedThisMonthUsd, reference) : null;

  const featureSpend = input.canViewBudgetDetails ? input.adminDashboard?.usageByFeatureUsd ?? {} : {};
  const highestCostOperationEntry = Object.entries(featureSpend).sort((a, b) => b[1] - a[1])[0];

  const pace = resolveBudgetPaceStatus({
    budgetStatus: input.canViewBudgetDetails ? input.budgetStatus : null,
    adminDashboard: input.canViewBudgetDetails ? input.adminDashboard : null,
    projectedMonthEndUsd: input.canViewBudgetDetails ? projectedMonthEndUsd : null,
  });

  const breakdownRows = buildBreakdownRows(
    input.filters.groupBy,
    input.costReporting,
    input.canViewBudgetDetails ? input.adminDashboard : null,
  );
  const activityRows = (input.canViewBudgetDetails ? input.adminDashboard?.recentEvents ?? [] : [])
    .map(mapAiUsageActivityRow)
    .filter((row) => matchesAiUsageActivityFilters(row, input.filters));

  const hasAnyUsage =
    (usedThisMonthUsd !== null && usedThisMonthUsd > 0)
    || rolling30DayTotalUsd > 0
    || activityRows.some((row) => row.estimatedCostUsd > 0);

  // Highest-cost KPIs need real attributed spend — never a scope placeholder at $0 (TB-1220).
  const highestCostProjectName =
    hasAnyUsage
    && costSummary?.topProjectName != null
    && (costSummary.topWorkspaceProjectEstimatedUsd ?? 0) > 0
      ? costSummary.topProjectName
      : null;
  const highestCostOperationName =
    hasAnyUsage
    && highestCostOperationEntry !== undefined
    && highestCostOperationEntry[1] > 0
      ? formatAiUsageFeatureLabel(highestCostOperationEntry[0])
      : null;

  const billingPeriodResetUtc =
    (input.billingPeriodUtcMonth ?? null) !== null
      ? resolveUtcMonthPeriodResetUtc(input.billingPeriodUtcMonth ?? "")
      : null;

  return {
    kpi: {
      usedThisMonthUsd,
      remainingBudgetUsd,
      budgetTotalUsd,
      budgetPercentUsed,
      projectedMonthEndUsd,
      projectedIsApproximate: true,
      daysRemainingInBillingPeriod: utcDaysRemainingInMonth(reference),
      changeVsPrior30DaysPercent:
        input.costReporting !== null ? compareRollingHalvesPercent(input.costReporting.daily) : null,
      changeVsPrior30DaysIsApproximate: true,
      highestCostProjectName,
      highestCostOperationName,
      currency: input.costReporting?.currency ?? "USD",
    },
    budgetPaceStatus: pace.status,
    budgetPaceLabel: paceStatusLabel(pace.status),
    governance: input.canViewBudgetDetails
      ? buildGovernanceControls(input.adminDashboard, input.budgetStatus)
      : null,
    breakdownRows,
    activityRows,
    hasAnyUsage,
    rolling30DayTotalUsd,
    costReportingState: resolveCostReportingState(input),
    budgetState: resolveBudgetState(input),
    activityState: resolveActivityState(input),
    freshness: {
      estimatesAsOfUtc: input.estimatesAsOfUtc ?? null,
      billingPeriodResetUtc,
      billingPeriodResetLabel:
        billingPeriodResetUtc !== null ? formatAiUsageBillingPeriodResetLabel(billingPeriodResetUtc) : null,
    },
  };
}

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

export function formatAiUsageRemainingBudgetCopy(remainingUsd: number, totalUsd: number): string {
  return `$${remainingUsd.toFixed(2)} remaining of $${totalUsd.toFixed(2)}`;
}

export function formatAiUsageUsedBudgetCopy(usedUsd: number, totalUsd: number): string {
  return `$${usedUsd.toFixed(2)} used of $${totalUsd.toFixed(2)}`;
}
