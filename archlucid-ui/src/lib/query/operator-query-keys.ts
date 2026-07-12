import type { RunsByProjectPagedParams } from "@/lib/query/runs-by-project-paged-params";

export const operatorQueryKeys = {
  tenantTrialStatus: ["operator", "tenant", "trial-status"] as const,
  tenantUsageStatus: ["operator", "tenant", "usage-status"] as const,
  healthReadySummary: ["operator", "health", "ready-summary"] as const,
  llmMonthlyBudgetStatus: ["operator", "llm", "monthly-budget-status"] as const,
  adminAiUsageDashboard: ["operator", "admin", "ai-usage-dashboard"] as const,
  executiveRoiSummary: ["operator", "roi", "executive-summary"] as const,
  complianceDriftTrend30d: ["operator", "governance", "compliance-drift-trend", "30d"] as const,
  corePilotCommitContext: ["operator", "core-pilot", "commit-context"] as const,
  pilotRecentDeltas: (count: number) => ["operator", "pilots", "recent-deltas", { count }] as const,
  runsByProjectPaged: (params: RunsByProjectPagedParams) => ["operator", "runs", "paged", params] as const,
};
