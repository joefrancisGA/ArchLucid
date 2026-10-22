import type { AdminAiUsageDashboard } from "@/lib/admin-ai-usage-dashboard";
import type { LlmCostDailyBucket } from "@/lib/llm-cost-reporting";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";
import {
  resolveLlmBudgetUtilizationTone,
} from "@/lib/llm-monthly-budget-status";

import type {
  AiUsageBudgetPaceStatus,
  AiUsageGovernanceControls,
} from "./ai-usage-dashboard-model-types";

function utcDaysInMonth(reference: Date): number {
  return new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 0)).getUTCDate();
}

export function utcDaysRemainingInMonth(reference: Date): number {
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

export function sumDailyCost(daily: readonly LlmCostDailyBucket[]): number {
  return daily.reduce((total, bucket) => total + bucket.estimatedCostUsd, 0);
}

export function compareRollingHalvesPercent(daily: readonly LlmCostDailyBucket[]): number | null {
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

export function resolveBudgetPaceStatus(input: {
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

export function paceStatusLabel(status: AiUsageBudgetPaceStatus): string {
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

export function buildGovernanceControls(
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
