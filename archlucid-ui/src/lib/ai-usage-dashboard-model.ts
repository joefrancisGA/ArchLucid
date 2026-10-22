import { buildLlmCostCommandCenterSummary } from "@/lib/llm-cost-command-center-summary";
import { hasLlmUsageInDailyBuckets } from "@/lib/llm-cost-reporting-display-labels";
import { llmBudgetUtilizationPercent } from "@/lib/llm-monthly-budget-status";

import { buildBreakdownRows } from "./ai-usage-breakdown-rows";
import {
  buildGovernanceControls,
  compareRollingHalvesPercent,
  formatAiUsageBillingPeriodResetLabel,
  paceStatusLabel,
  projectMonthEndSpendUsd,
  resolveBudgetPaceStatus,
  resolveUtcMonthPeriodResetUtc,
  sumDailyCost,
  utcDaysRemainingInMonth,
} from "./ai-usage-budget-pace";
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

export {
  formatAiUsageBillingPeriodResetLabel,
  formatAiUsageEstimatesAsOfLabel,
  projectMonthEndSpendUsd,
  resolveAiUsageEstimatesAsOfUtc,
  resolveUtcMonthPeriodResetUtc,
} from "./ai-usage-budget-pace";

export {
  dailyMetricAccessibleSummary,
  dailyMetricValue,
  formatAiUsageRemainingBudgetCopy,
  formatAiUsageUsedBudgetCopy,
} from "./ai-usage-dashboard-formatters";

import type {
  AiUsageDashboardDerived,
  AiUsageSectionLoadState,
  BuildAiUsageDashboardDerivedInput,
} from "./ai-usage-dashboard-model-types";

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
