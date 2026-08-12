import type { ExecutiveTimeRange } from "@/lib/executive/executive-time-range";
import type { RunsByProjectPagedParams } from "@/lib/query/runs-by-project-paged-params";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";

export const operatorQueryKeys = {
  tenantTrialStatus: ["operator", "tenant", "trial-status"] as const,
  tenantUsageStatus: ["operator", "tenant", "usage-status"] as const,
  billingSubscriptionStatus: ["operator", "tenant", "billing-subscription-status"] as const,
  operatorStickinessSnapshot: ["operator", "tenant", "stickiness-snapshot"] as const,
  healthReadySummary: ["operator", "health", "ready-summary"] as const,
  /** Throws when readiness cannot be loaded — preserves last payload on refetch errors. */
  healthReadySummaryStrict: ["operator", "health", "ready-summary", "strict"] as const,
  tenantCatalogMigrationStatus: ["operator", "tenant", "catalog-migration-status"] as const,
  llmMonthlyBudgetStatus: ["operator", "llm", "monthly-budget-status"] as const,
  adminAiUsageDashboard: ["operator", "admin", "ai-usage-dashboard"] as const,
  executiveRoiSummary: ["operator", "roi", "executive-summary"] as const,
  // Prefix-matches executiveRoiSummary so refreshDashboard invalidation also refreshes these.
  executiveRoiSummaryHistory: ["operator", "roi", "executive-summary", "history"] as const,
  executiveRoiSummaryExport: ["operator", "roi", "executive-summary", "export"] as const,
  executiveNextActionInputs: (range: ExecutiveTimeRange) =>
    ["operator", "roi", "next-action-inputs", range] as const,
  complianceDriftTrend30d: ["operator", "governance", "compliance-drift-trend", "30d"] as const,
  governanceReviewsAwaitingAction: (scope: OperatorScopeQueryKey) =>
    ["operator", "governance", "reviews-awaiting-action", scope] as const,
  governanceFindingsQueue: (
    scope: OperatorScopeQueryKey,
    useCuratedDemoSpine: boolean,
  ) =>
    ["operator", "governance", "findings-queue", scope, { useCuratedDemoSpine }] as const,
  corePilotCommitContext: ["operator", "core-pilot", "commit-context"] as const,
  pilotRecentDeltas: (scope: OperatorScopeQueryKey, count: number) =>
    ["operator", "pilots", "recent-deltas", scope, { count }] as const,
  runsByProjectPaged: (params: RunsByProjectPagedParams) => ["operator", "runs", "paged", params] as const,
  askProjectRuns: (projectId: string) => ["operator", "ask", "project-runs", projectId] as const,
  architectureDigestsBrowse: (scope: OperatorScopeQueryKey, take: number) =>
    ["operator", "digests", "architecture-list", scope, { take }] as const,
  digestSubscriptions: (scope: OperatorScopeQueryKey) =>
    ["operator", "digests", "subscriptions", scope] as const,
  advisoryRecommendations: (scope: OperatorScopeQueryKey, runId: string) =>
    ["operator", "advisory", "recommendations", scope, runId] as const,
  conversationThreads: (take: number) => ["operator", "conversations", "threads", { take }] as const,
  tenantHomepageSettings: ["operator", "tenant", "homepage-settings"] as const,
  featuredCompletedSampleCandidates: ["operator", "tenant", "homepage-settings", "eligible-samples"] as const,
  patternLibraryInsightCards: ["operator", "analytics", "pattern-insight-cards"] as const,
  alertsInboxPage: (
    scope: OperatorScopeQueryKey,
    params: { readonly statusFilter: string | null; readonly cursor: string },
  ) => ["operator", "alerts", "inbox-page", scope, params] as const,
  alertsInboxSummary: (scope: OperatorScopeQueryKey) =>
    ["operator", "alerts", "inbox-summary", scope] as const,
  /** Hub aggregates for /administration/notifications — must not share alertsInboxSummary cache shape. */
  notificationChannelDeliverySnapshot: (scope: OperatorScopeQueryKey) =>
    ["operator", "administration", "notifications", "channel-delivery-snapshot", scope] as const,
  alertsInboxWorkspaceContext: (scope: OperatorScopeQueryKey) =>
    ["operator", "alerts", "workspace-context", scope] as const,
  auditEventsSearch: (
    scope: OperatorScopeQueryKey,
    filters: Record<string, string>,
    cursor: string | null,
  ) => ["operator", "audit", "events-search", scope, filters, { cursor }] as const,
};
