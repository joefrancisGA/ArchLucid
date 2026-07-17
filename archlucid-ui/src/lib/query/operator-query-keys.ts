import type { RunsByProjectPagedParams } from "@/lib/query/runs-by-project-paged-params";
import type { OperatorScopeQueryKey } from "@/lib/operator-scope-query-key";

export const operatorQueryKeys = {
  tenantTrialStatus: ["operator", "tenant", "trial-status"] as const,
  tenantUsageStatus: ["operator", "tenant", "usage-status"] as const,
  healthReadySummary: ["operator", "health", "ready-summary"] as const,
  llmMonthlyBudgetStatus: ["operator", "llm", "monthly-budget-status"] as const,
  adminAiUsageDashboard: ["operator", "admin", "ai-usage-dashboard"] as const,
  executiveRoiSummary: ["operator", "roi", "executive-summary"] as const,
  complianceDriftTrend30d: ["operator", "governance", "compliance-drift-trend", "30d"] as const,
  governanceFindingsQueue: (
    scope: OperatorScopeQueryKey,
    useCuratedDemoSpine: boolean,
  ) =>
    ["operator", "governance", "findings-queue", scope, { useCuratedDemoSpine }] as const,
  corePilotCommitContext: ["operator", "core-pilot", "commit-context"] as const,
  pilotRecentDeltas: (count: number) => ["operator", "pilots", "recent-deltas", { count }] as const,
  runsByProjectPaged: (params: RunsByProjectPagedParams) => ["operator", "runs", "paged", params] as const,
  tenantHomepageSettings: ["operator", "tenant", "homepage-settings"] as const,
  featuredCompletedSampleCandidates: ["operator", "tenant", "homepage-settings", "eligible-samples"] as const,
  patternLibraryInsightCards: ["operator", "analytics", "pattern-insight-cards"] as const,
};
