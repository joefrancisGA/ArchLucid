import type { AdminAiUsageDashboard } from "@/lib/admin-ai-usage-dashboard";
import type { AiUsageDashboardFilters } from "@/lib/ai-usage-dashboard-filters";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";
import type { LlmCostReportingDashboard } from "@/lib/llm-cost-reporting";

import type {
  AiUsageActivityRow,
  AiUsageBreakdownRow,
  AiUsageBudgetPaceStatus,
  AiUsageKpiSummary,
  AiUsageSectionLoadState,
} from "./ai-usage-dashboard-model-row-types";

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
