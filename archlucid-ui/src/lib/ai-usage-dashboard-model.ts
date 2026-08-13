import type { AdminAiUsageDashboard, AdminAiUsageEventRow } from "@/lib/admin-ai-usage-dashboard";
import type {
  AiUsageActivityStatusFilter,
  AiUsageBreakdownGroupBy,
  AiUsageDashboardFilters,
} from "@/lib/ai-usage-dashboard-filters";
import { buildLlmCostCommandCenterSummary } from "@/lib/llm-cost-command-center-summary";
import type { LlmCostDailyBucket, LlmCostReportingDashboard } from "@/lib/llm-cost-reporting";
import { hasLlmUsageInDailyBuckets } from "@/lib/llm-cost-reporting-display-labels";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";
import {
  llmBudgetUtilizationPercent,
  resolveLlmBudgetUtilizationTone,
} from "@/lib/llm-monthly-budget-status";

export type AiUsageSectionLoadState =
  | "loading"
  | "ready"
  | "empty"
  | "error"
  | "delayed"
  | "permission_restricted"
  | "inactive";

export type AiUsageBudgetPaceStatus = "on_track" | "approaching_limit" | "at_risk" | "exhausted" | "inactive";

export type AiUsageActivityBadge = "Manual" | "Scheduled" | "Retry" | "Evidence check" | "Skipped";

export type AiUsageActivityStatus =
  | "Completed"
  | "Running"
  | "Failed"
  | "Skipped"
  | "Budget blocked"
  | "Cancelled";

export type AiUsageDailyMetric = "cost" | "tokens" | "operations" | "requests";

export type AiUsageKpiSummary = {
  readonly usedThisMonthUsd: number | null;
  readonly remainingBudgetUsd: number | null;
  readonly budgetTotalUsd: number | null;
  readonly budgetPercentUsed: number | null;
  readonly projectedMonthEndUsd: number | null;
  readonly projectedIsApproximate: boolean;
  readonly daysRemainingInBillingPeriod: number | null;
  readonly changeVsPrior30DaysPercent: number | null;
  readonly changeVsPrior30DaysIsApproximate: boolean;
  readonly highestCostProjectName: string | null;
  readonly highestCostOperationName: string | null;
  readonly currency: string;
};

export type AiUsageBreakdownRow = {
  readonly key: string;
  readonly name: string;
  readonly usageCount: number;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly estimatedCostUsd: number;
  readonly percentOfTotal: number;
  readonly trendPercent: number | null;
  readonly detailHref: string | null;
};

export type AiUsageActivityRow = {
  readonly key: string;
  readonly occurredUtc: string;
  readonly subjectLabel: string;
  readonly operationLabel: string;
  readonly modelLabel: string;
  readonly initiatedByLabel: string;
  readonly triggerBadge: AiUsageActivityBadge;
  readonly promptTokens: number | null;
  readonly completionTokens: number | null;
  readonly estimatedCostUsd: number;
  readonly actualCostUsd: number | null;
  readonly status: AiUsageActivityStatus;
  readonly budgetUsedLabel: string;
  readonly detailHref: string | null;
  readonly feature: string;
  readonly userId: string | null;
  readonly providerKind: string;
};

export type AiUsageGovernanceControls = {
  readonly monthlyBudgetUsd: number | null;
  readonly warningThresholdPercent: number | null;
  readonly hardStopEnabled: boolean;
  readonly resetPeriod: string | null;
  readonly billingPeriodResetLabel: string | null;
  readonly workspaceKind: string | null;
  readonly customerAiProviderConfigured: boolean;
};

export type AiUsageFreshness = {
  readonly estimatesAsOfUtc: string | null;
  readonly billingPeriodResetUtc: string | null;
  readonly billingPeriodResetLabel: string | null;
};

export type AiUsageDashboardDerived = {
  readonly kpi: AiUsageKpiSummary;
  readonly budgetPaceStatus: AiUsageBudgetPaceStatus;
  readonly budgetPaceLabel: string;
  readonly governance: AiUsageGovernanceControls | null;
  readonly breakdownRows: readonly AiUsageBreakdownRow[];
  readonly activityRows: readonly AiUsageActivityRow[];
  readonly hasAnyUsage: boolean;
  readonly rolling30DayTotalUsd: number;
  readonly costReportingState: AiUsageSectionLoadState;
  readonly budgetState: AiUsageSectionLoadState;
  readonly activityState: AiUsageSectionLoadState;
  readonly freshness: AiUsageFreshness;
};

export type BuildAiUsageDashboardDerivedInput = {
  readonly costReporting: LlmCostReportingDashboard | null;
  readonly costReportingLoading: boolean;
  readonly costReportingError: boolean;
  readonly costReportingDelayed: boolean;
  readonly budgetStatus: LlmMonthlyDollarBudgetStatus | null;
  readonly budgetLoading: boolean;
  readonly budgetError: boolean;
  readonly budgetForbidden: boolean;
  readonly adminDashboard: AdminAiUsageDashboard | null;
  readonly adminLoading: boolean;
  readonly adminError: boolean;
  readonly adminForbidden: boolean;
  readonly filters: AiUsageDashboardFilters;
  readonly canViewBudgetDetails: boolean;
  readonly canManageBudget: boolean;
  readonly estimatesAsOfUtc?: string | null;
  readonly billingPeriodUtcMonth?: string | null;
};

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

export function formatAiUsageFeatureLabel(feature: string): string {
  switch (feature) {
    case "ArchitectureGeneration":
      return "Architecture generation";
    case "ReviewAnalysis":
      return "Review analysis";
    case "EvidenceQa":
      return "Evidence Q&A";
    case "EvidenceIndexing":
      return "Evidence indexing";
    case "Comparison":
      return "Comparison";
    case "ReportGeneration":
      return "Report generation";
    case "QuickScan":
      return "Quick Scan";
    default:
      return feature.replace(/([a-z])([A-Z])/g, "$1 $2");
  }
}

function isSystemInitiator(userId: string | null): boolean {
  if (userId === null) {
    return true;
  }

  const normalized = userId.trim().toLowerCase();

  return normalized.length === 0 || normalized === "system" || normalized === "scheduler";
}

/** Infers trigger badges until the API exposes explicit run origin. */
export function inferAiUsageActivityBadge(event: AdminAiUsageEventRow): AiUsageActivityBadge {
  if (event.servedFromDemoCache && event.estimatedCostUsd <= 0) {
    return "Skipped";
  }

  if (event.feature === "EvidenceIndexing" || event.feature === "EvidenceQa") {
    return "Evidence check";
  }

  if (isSystemInitiator(event.userId)) {
    return "Scheduled";
  }

  return "Manual";
}

export function inferAiUsageActivityStatus(event: AdminAiUsageEventRow): AiUsageActivityStatus {
  if (event.budgetBlocked) {
    return "Budget blocked";
  }

  if (event.servedFromDemoCache && event.estimatedCostUsd <= 0) {
    return "Skipped";
  }

  return "Completed";
}

function formatBudgetUsedLabel(event: AdminAiUsageEventRow): string {
  if (event.budgetBlocked) {
    return "AI budget used: blocked before execution";
  }

  if (event.servedFromDemoCache && event.estimatedCostUsd <= 0) {
    return "AI budget used: $0.00";
  }

  return `AI budget used: $${event.estimatedCostUsd.toFixed(2)}`;
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

function mapActivityRow(event: AdminAiUsageEventRow, index: number): AiUsageActivityRow {
  const status = inferAiUsageActivityStatus(event);
  const triggerBadge = inferAiUsageActivityBadge(event);

  return {
    key: `${event.occurredUtc}-${index}`,
    occurredUtc: event.occurredUtc,
    subjectLabel: formatAiUsageFeatureLabel(event.feature),
    operationLabel: formatAiUsageFeatureLabel(event.feature),
    modelLabel: event.providerKind.trim().length > 0 ? event.providerKind : "—",
    initiatedByLabel: event.userId ?? "System / scheduled",
    triggerBadge,
    promptTokens: null,
    completionTokens: null,
    estimatedCostUsd: event.estimatedCostUsd,
    actualCostUsd: null,
    status,
    budgetUsedLabel: formatBudgetUsedLabel(event),
    detailHref: null,
    feature: event.feature,
    userId: event.userId,
    providerKind: event.providerKind,
  };
}

function matchesActivityFilters(row: AiUsageActivityRow, filters: AiUsageDashboardFilters): boolean {
  if (filters.feature !== null && row.feature !== filters.feature) {
    return false;
  }

  if (filters.userId !== null && (row.userId ?? "") !== filters.userId) {
    return false;
  }

  if (filters.model !== null && row.providerKind !== filters.model) {
    return false;
  }

  if (filters.trigger === "manual" && row.triggerBadge !== "Manual") {
    return false;
  }

  if (filters.trigger === "scheduled" && row.triggerBadge !== "Scheduled") {
    return false;
  }

  if (filters.status !== "all") {
    const normalized = row.status.toLowerCase().replace(/\s+/g, "_") as AiUsageActivityStatusFilter;

    if (normalized !== filters.status) {
      return false;
    }
  }

  return true;
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
    .map(mapActivityRow)
    .filter((row) => matchesActivityFilters(row, input.filters));

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

export function buildAiUsageActivityCsv(rows: readonly AiUsageActivityRow[]): string {
  const header = [
    "occurredUtc",
    "operation",
    "model",
    "initiatedBy",
    "trigger",
    "estimatedCostUsd",
    "status",
    "budgetUsed",
  ];

  const lines = rows.map((row) =>
    [
      row.occurredUtc,
      row.operationLabel,
      row.modelLabel,
      row.initiatedByLabel,
      row.triggerBadge,
      row.estimatedCostUsd.toFixed(2),
      row.status,
      row.budgetUsedLabel,
    ]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
      .join(","),
  );

  return [header.join(","), ...lines].join("\n");
}
