import type { ExecutiveTimeRange } from "@/lib/executive-time-range";
import type { RunsByProjectPagedParams } from "@/lib/query/runs-by-project-paged-params";
import type { OperatorScopeQueryKey } from "@/lib/operator-scope-query-key";

export const operatorQueryKeys = {
  tenantTrialStatus: ["operator", "tenant", "trial-status"] as const,
  tenantUsageStatus: ["operator", "tenant", "usage-status"] as const,
  healthReadySummary: ["operator", "health", "ready-summary"] as const,
  llmMonthlyBudgetStatus: ["operator", "llm", "monthly-budget-status"] as const,
  adminAiUsageDashboard: ["operator", "admin", "ai-usage-dashboard"] as const,
  executiveRoiSummary: ["operator", "roi", "executive-summary"] as const,
  // Prefix-matches executiveRoiSummary so refreshDashboard invalidation also refreshes these.
  executiveRoiSummaryHistory: ["operator", "roi", "executive-summary", "history"] as const,
  executiveRoiSummaryExport: ["operator", "roi", "executive-summary", "export"] as const,
  executiveNextActionInputs: (range: ExecutiveTimeRange) =>
    ["operator", "roi", "next-action-inputs", range] as const,
  complianceDriftTrend30d: ["operator", "governance", "compliance-drift-trend", "30d"] as const,
  governanceFindingsQueue: (
    scope: OperatorScopeQueryKey,
    useCuratedDemoSpine: boolean,
  ) =>
    ["operator", "governance", "findings-queue", scope, { useCuratedDemoSpine }] as const,
  corePilotCommitContext: ["operator", "core-pilot", "commit-context"] as const,
  pilotRecentDeltas: (count: number) => ["operator", "pilots", "recent-deltas", { count }] as const,
  runsByProjectPaged: (params: RunsByProjectPagedParams) => ["operator", "runs", "paged", params] as const,
  askProjectRuns: (projectId: string) => ["operator", "ask", "project-runs", projectId] as const,
  conversationThreads: (take: number) => ["operator", "conversations", "threads", { take }] as const,
  tenantHomepageSettings: ["operator", "tenant", "homepage-settings"] as const,
  featuredCompletedSampleCandidates: ["operator", "tenant", "homepage-settings", "eligible-samples"] as const,
  patternLibraryInsightCards: ["operator", "analytics", "pattern-insight-cards"] as const,
};
