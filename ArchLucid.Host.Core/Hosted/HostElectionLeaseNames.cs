namespace ArchLucid.Host.Core.Hosted;

/// <summary>
/// Keys in <c>dbo.HostLeaderLeases</c>; must stay stable across versions.
/// </summary>
public static class HostElectionLeaseNames
{
    public const string AdvisoryScanPolling = "hosted:advisory-scan-polling";

    public const string ArchitectureReviewRecurrencePolling = "hosted:architecture-review-recurrence-polling";

    public const string DataArchival = "hosted:data-archival";

    public const string RetrievalIndexingOutbox = "hosted:retrieval-indexing-outbox";

    public const string RunExportBlobPushOutbox = "hosted:run-export-blob-push-outbox";

    public const string PostCommitProjectionOutbox = "hosted:post-commit-projection-outbox";

    public const string CosmosGraphSnapshotOutbox = "hosted:cosmos-graph-snapshot-outbox";

    public const string IntegrationEventOutbox = "hosted:integration-event-outbox";

    public const string AuthorityPipelineWorkOutbox = "hosted:authority-pipeline-work-outbox";

    public const string TrialLifecycleEmailPolling = "hosted:trial-lifecycle-email-polling";

    public const string ExecDigestWeeklyPolling = "hosted:exec-digest-weekly-polling";

    public const string WeeklyExecutiveSummaryPolling = "hosted:weekly-executive-summary-polling";

    public const string WeeklyArchitectureDigestPolling = "hosted:weekly-architecture-digest-polling";

    public const string TrialLifecycleAutomation = "hosted:trial-lifecycle-automation";

    public const string TenantHealthScoring = "hosted:tenant-health-scoring";

    public const string TrialArchitecturePreseed = "hosted:trial-architecture-preseed";

    public const string DataConsistencyReconciliation = "hosted:data-consistency-reconciliation";

    public const string FirstTenantFunnelArchival = "hosted:first-tenant-funnel-archival";

    public const string ArchitectureProjectRetentionPurge = "hosted:architecture-project-retention-purge";

    public const string AzureExtractorAutoPull = "hosted:azure-extractor-auto-pull";

    public const string AwsExtractorAutoPull = "hosted:aws-extractor-auto-pull";

    public const string GcpExtractorAutoPull = "hosted:gcp-extractor-auto-pull";

    public const string InternalCrossTenantRollup = "hosted:internal-cross-tenant-rollup";

    public const string SamlCertExpiryNotification = "hosted:saml-cert-expiry-notification";

    public const string TenantErasureEligiblePurge = "hosted:tenant-erasure-eligible-purge";

    public const string OrphanedTenantCatalogCleanup = "hosted:orphaned-tenant-catalog-cleanup";

    public const string SampleRunTtlPurge = "hosted:sample-run-ttl-purge";

    public const string DraftIntakeReaper = "hosted:draft-intake-reaper";

    public const string IntegrationEventDlqRetry = "hosted:integration-event-dlq-retry";

    public const string ExecutiveRoiCacheWarmup = "hosted:executive-roi-cache-warmup";

    public const string ExecutiveRoiSavingsGauge = "hosted:executive-roi-savings-gauge";

    public const string AgentResultBlobCleanup = "hosted:agent-result-blob-cleanup";

    public const string WarmTenantCatalogReplenish = "hosted:warm-tenant-catalog-replenish";

    public const string BackgroundJobStuckRunningWatchdog = "hosted:background-job-stuck-running-watchdog";

    public const string DataConsistencyOrphanProbe = "hosted:data-consistency-orphan-probe";

    public const string RequiredAuditTrailOrphanProbe = "hosted:required-audit-trail-orphan-probe";

    public const string OutboxOperationalMetrics = "hosted:outbox-operational-metrics";

    public const string StaleInFlightRunMetrics = "hosted:stale-in-flight-run-metrics";

    public const string LlmTenantBudgetUtilizationMetrics = "hosted:llm-tenant-budget-utilization-metrics";

    public const string MarketingPricingQuoteAgingMetrics = "hosted:marketing-pricing-quote-aging-metrics";

    public const string ExemplarCorpusStartupIndexer = "hosted:exemplar-corpus-startup-indexer";

    public const string PolicyPackCorpusStartupIndexer = "hosted:policy-pack-corpus-startup-indexer";

    public const string PlatformDocCorpusStartupIndexer = "hosted:platform-doc-corpus-startup-indexer";

    public const string QuickScanBudgetReconciliation = "hosted:quick-scan-budget-reconciliation";
}
