import type { LlmCostReportingDashboard } from "@/lib/llm-cost-reporting";

export type CostReportingSettingsPageSurface = "demo" | "authority_loading" | "forbidden" | "granted";

export type CostReportingSettingsPageViewModel = {
  readonly surface: CostReportingSettingsPageSurface;
  readonly loading: boolean;
  readonly data: LlmCostReportingDashboard | null;
  readonly load: () => Promise<void>;
};
