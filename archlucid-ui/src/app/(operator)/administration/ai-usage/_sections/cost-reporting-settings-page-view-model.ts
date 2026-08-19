import type { AdminAiUsageDashboard } from "@/lib/admin-ai-usage-dashboard";
import type { AiUsageDashboardFilters } from "@/lib/ai-usage-dashboard-filters";
import type { AiUsageDashboardDerived } from "@/lib/ai-usage-dashboard-model";
import type { LlmCostReportingDashboard } from "@/lib/llm-cost-reporting";
import type { LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";

export type CostReportingSettingsPageSurface = "demo" | "authority_loading" | "forbidden" | "granted";

export type CostReportingSettingsPageViewModel = {
  readonly surface: CostReportingSettingsPageSurface;
  readonly loading: boolean;
  readonly data: LlmCostReportingDashboard | null;
  readonly budgetStatus: LlmMonthlyDollarBudgetStatus | null;
  readonly adminDashboard: AdminAiUsageDashboard | null;
  readonly derived: AiUsageDashboardDerived;
  readonly filters: AiUsageDashboardFilters;
  readonly canViewBudgetDetails: boolean;
  readonly canManageBudget: boolean;
  readonly showDetailedActivityLink: boolean;
  readonly load: (options?: import("./use-cost-reporting-settings-page").CostReportingSettingsPageLoadOptions) => Promise<void>;
  readonly setFilters: (filters: AiUsageDashboardFilters) => void;
};
