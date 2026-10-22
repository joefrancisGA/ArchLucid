import { BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import type { LlmCostDailyBucket, LlmCostReportingDashboard, LlmCostWorkspaceProjectRow } from "@/lib/llm-cost-reporting";

const INTERNAL_WORKSPACE_NAME_PATTERN = /^development default tenant$/i;

/** Customer-facing workspace label — hides dev bootstrap tenant names outside internal operator shells. */
export function formatCostReportingWorkspaceLabel(rawName: string): string {
  if (isArchLucidInternalOperatorShellEnv()) {
    const trimmed = rawName.trim();

    return trimmed.length > 0 ? trimmed : "Workspace";
  }

  if (typeof window !== "undefined") {
    const stored = readOperatorScopeFromStorage();

    if (stored !== null && stored.workspaceLabel.trim().length > 0) {
      return stored.workspaceLabel.trim();
    }
  }

  const trimmed = rawName.trim();

  if (trimmed.length === 0 || INTERNAL_WORKSPACE_NAME_PATTERN.test(trimmed)) {
    return BUYER_SCOPE_SAMPLE_WORKSPACE_COMPACT_LABEL;
  }

  return trimmed;
}

/** Project label for usage tables — preserves API copy such as "Current project". */
export function formatCostReportingProjectLabel(rawName: string): string {
  const trimmed = rawName.trim();

  return trimmed.length > 0 ? trimmed : "Current project";
}

export function formatUtcBillingMonthLabel(reference: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(reference);

  return `Billing month: ${formatted} UTC`;
}

export function formatUtcTodayLabel(reference: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(reference);

  return `Today: ${formatted}`;
}

export function hasLlmUsageInDailyBuckets(daily: readonly LlmCostDailyBucket[]): boolean {
  return daily.some(
    (bucket) => bucket.estimatedCostUsd > 0 || bucket.promptTokens > 0 || bucket.completionTokens > 0,
  );
}

export function hasWorkspaceProjectUsage(rows: readonly LlmCostWorkspaceProjectRow[]): boolean {
  return rows.some(
    (row) => row.estimatedCostUsd > 0 || row.promptTokens > 0 || row.completionTokens > 0,
  );
}

/** Applies buyer-safe workspace labels before rendering usage breakdowns. */
export function normalizeLlmCostReportingDashboardForDisplay(
  dashboard: LlmCostReportingDashboard,
): LlmCostReportingDashboard {
  return {
    ...dashboard,
    byWorkspaceProject: dashboard.byWorkspaceProject.map((row) => ({
      ...row,
      workspaceName: formatCostReportingWorkspaceLabel(row.workspaceName),
      projectName: formatCostReportingProjectLabel(row.projectName),
    })),
  };
}
