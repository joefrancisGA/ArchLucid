import type { SponsorTimeRange } from "@/lib/sponsor/sponsor-time-range";
import type { RunsByProjectPagedParams } from "@/lib/query/runs-by-project-paged-params";
import type { OperatorScopeQueryKey } from "@/lib/operator/operator-scope-query-key";

export const operatorQueryKeys = {
  /** Account-wide preferences — shared across root ColorModePreferenceProvider and operator shell (TB-2303). */
  userPreferences: ["user", "preferences"] as const,
  tenantTrialStatus: ["operator", "tenant", "trial-status"] as const,
  tenantWorkspacesList: (scope: OperatorScopeQueryKey) =>
    ["operator", "tenant", "workspaces", scope] as const,
  tenantCostSettings: ["operator", "tenant", "cost-settings"] as const,
  agentOutputQualityGateMode: ["operator", "admin", "agent-output-quality-gate-mode"] as const,
  tenantUsageStatus: ["operator", "tenant", "usage-status"] as const,
  billingSubscriptionStatus: ["operator", "tenant", "billing-subscription-status"] as const,
  operatorStickinessSnapshot: ["operator", "tenant", "stickiness-snapshot"] as const,
  adminConfigLintSummary: ["operator", "admin", "config-lint-summary"] as const,
  adminIdentityProvidersPageBundle: ["operator", "admin", "identity-providers-page-bundle"] as const,
  adminPrerequisitesCloudSummary: ["operator", "admin", "prerequisites-cloud-summary"] as const,
  adminOutboxDiagnostics: ["operator", "admin", "outbox-diagnostics"] as const,
  pilotScorecard: ["operator", "pilots", "scorecard"] as const,
  operatorAiQualitySnapshot: ["operator", "assistant", "ai-quality-snapshot"] as const,
  firstPilotProofStatusSnapshot: ["operator", "first-pilot", "proof-status-snapshot"] as const,
  operatorTaskSuccessRates: ["operator", "diagnostics", "task-success-rates"] as const,
  healthReadySummary: ["operator", "health", "ready-summary"] as const,
  devTestingQuickJumpSnapshot: (runIdsKey: string) =>
    ["operator", "dev-testing", "quick-jump", runIdsKey] as const,
  tenantCatalogMigrationStatus: ["operator", "tenant", "catalog-migration-status"] as const,
  operatorShellStatus: (scope: OperatorScopeQueryKey) =>
    ["operator", "shell-status", scope] as const,
  llmMonthlyBudgetStatus: ["operator", "llm", "monthly-budget-status"] as const,
  adminAiUsageDashboard: ["operator", "admin", "ai-usage-dashboard"] as const,
  sponsorRoiSummary: ["operator", "roi", "sponsor-report"] as const,
  sponsorDashboardBundle: ["operator", "roi", "sponsor-dashboard-bundle"] as const,
  // Prefix-matches sponsorRoiSummary so refreshDashboard invalidation also refreshes these.
  sponsorRoiSummaryHistory: ["operator", "roi", "sponsor-report", "history"] as const,
  sponsorRoiSummaryExport: ["operator", "roi", "sponsor-report", "export"] as const,
  sqlBackupRegionVerification: ["operator", "sponsor", "sql-backup-region-verification"] as const,
  executiveNextActionInputs: (range: SponsorTimeRange) =>
    ["operator", "roi", "next-action-inputs", range] as const,
  complianceDriftTrend30d: ["operator", "governance", "compliance-drift-trend", "30d"] as const,
  complianceDriftTrendRange: (fromUtc: string, toUtc: string) =>
    ["operator", "governance", "compliance-drift-trend", { fromUtc, toUtc }] as const,
  governancePrecommitBlockedCount: (fromUtcIso: string, toUtcIso: string) =>
    ["operator", "governance", "precommit-blocked-count", { fromUtcIso, toUtcIso }] as const,
  workspaceHealthPrecommitAuditCounts30d:
    ["operator", "workspace-health", "precommit-audit-counts", "30d"] as const,
  pilotValueReport: (fromUtc: string, toUtc: string) =>
    ["operator", "pilots", "value-report", { fromUtc, toUtc }] as const,
  operatorNextBestActions: ["operator", "tenant", "next-best-actions"] as const,
  governanceDecisionsNeededSummary: (projectId?: string) =>
    ["operator", "governance", "decisions-needed-summary", projectId ?? "workspace"] as const,
  governancePosture: (projectId?: string) =>
    ["operator", "governance", "posture", projectId ?? "workspace"] as const,
  governanceDashboard: (maxPending: number, maxDecisions: number, maxChanges: number) =>
    ["operator", "governance", "dashboard", { maxPending, maxDecisions, maxChanges }] as const,
  governanceApprovalRequests: (runId: string) =>
    ["operator", "governance", "approval-requests", runId] as const,
  governancePromotions: (runId: string) => ["operator", "governance", "promotions", runId] as const,
  governanceActivations: (runId: string) => ["operator", "governance", "activations", runId] as const,
  governanceReviewContext: (runId: string) =>
    ["operator", "governance", "review-context", runId] as const,
  governanceReviewsAwaitingAction: (scope: OperatorScopeQueryKey) =>
    ["operator", "governance", "reviews-awaiting-action", scope] as const,
  governanceFindingsQueue: (
    scope: OperatorScopeQueryKey,
    useCuratedDemoSpine: boolean,
  ) =>
    ["operator", "governance", "findings-queue", scope, { useCuratedDemoSpine }] as const,
  governanceAssignedToMeFindingsQueue: (scope: OperatorScopeQueryKey) =>
    ["operator", "governance", "findings-queue", "assigned-to-me", scope] as const,
  governanceAssignedToMeFindingsCount: (scope: OperatorScopeQueryKey) =>
    ["operator", "governance", "findings-queue", "assigned-to-me-count", scope] as const,
  corePilotCommitContext: ["operator", "core-pilot", "commit-context"] as const,
  corePilotTeamChecklist: ["operator", "tenant", "core-pilot-team-checklist"] as const,
  pilotRecentDeltas: (scope: OperatorScopeQueryKey, count: number) =>
    ["operator", "pilots", "recent-deltas", scope, { count }] as const,
  pilotRunDeltas: (scope: OperatorScopeQueryKey, runId: string) =>
    ["operator", "pilots", "run-deltas", scope, runId] as const,
  runsByProjectPaged: (params: RunsByProjectPagedParams) => ["operator", "runs", "paged", params] as const,
  askProjectRuns: (projectId: string) => ["operator", "ask", "project-runs", projectId] as const,
  architectureDigestsBrowse: (scope: OperatorScopeQueryKey, take: number) =>
    ["operator", "digests", "architecture-list", scope, { take }] as const,
  digestSubscriptions: (scope: OperatorScopeQueryKey) =>
    ["operator", "digests", "subscriptions", scope] as const,
  digestSubscriptionDeliveryAttempts: (
    scope: OperatorScopeQueryKey,
    subscriptionId: string,
    refreshToken: number,
  ) =>
    ["operator", "digests", "subscription-attempts", scope, subscriptionId, refreshToken] as const,
  helpTopicMarkdown: (slug: string) => ["operator", "help", "topic-markdown", slug] as const,
  architectureDraft: (architectureId: string) =>
    ["operator", "architecture", "draft", architectureId] as const,
  helpDocsIndex: ["operator", "help", "docs-index"] as const,
  marketingPublicPricing: ["marketing", "pricing-json"] as const,
  pilotOutcomeSummary: ["operator", "pilots", "outcome-summary"] as const,
  recurrenceSchedulePreview: (cron: string) =>
    ["operator", "governance", "recurrence-preview", cron] as const,
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
  alertRulesList: (scope: OperatorScopeQueryKey) =>
    ["operator", "alerts", "rules-list", scope] as const,
  alertRoutingSubscriptions: (scope: OperatorScopeQueryKey) =>
    ["operator", "alerts", "routing-subscriptions", scope] as const,
  compositeAlertRulesList: (scope: OperatorScopeQueryKey) =>
    ["operator", "alerts", "composite-rules-list", scope] as const,
  auditEventsSearch: (
    scope: OperatorScopeQueryKey,
    filters: Record<string, string>,
    cursor: string | null,
  ) => ["operator", "audit", "events-search", scope, filters, { cursor }] as const,
};
