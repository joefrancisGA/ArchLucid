import type { AdminAiUsageDashboard } from "@/lib/admin-ai-usage-dashboard";
import type { AdminAiUsageEventRow } from "@/lib/admin-ai-usage-dashboard";
import type { AiUsageDashboardFilters, AiUsageActivityStatusFilter } from "@/lib/ai-usage-dashboard-filters";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";
import type { LlmCostReportingDashboard } from "@/lib/llm-cost-reporting";

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
} from "./ai-usage-dashboard-model-types";

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
