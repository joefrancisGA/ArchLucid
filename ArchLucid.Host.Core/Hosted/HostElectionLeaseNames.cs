namespace ArchLucid.Host.Core.Hosted;

/// <summary>
/// Keys in <c>dbo.HostLeaderLeases</c>; must stay stable across versions.
/// </summary>
public static class HostElectionLeaseNames
{
    public const string AdvisoryScanPolling = "hosted:advisory-scan-polling";

    public const string DataArchival = "hosted:data-archival";

    public const string RetrievalIndexingOutbox = "hosted:retrieval-indexing-outbox";

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

    public const string InternalCrossTenantRollup = "hosted:internal-cross-tenant-rollup";

    public const string SamlCertExpiryNotification = "hosted:saml-cert-expiry-notification";

    public const string TenantErasureEligiblePurge = "hosted:tenant-erasure-eligible-purge";

    public const string SampleRunTtlPurge = "hosted:sample-run-ttl-purge";

    public const string IntegrationEventDlqRetry = "hosted:integration-event-dlq-retry";
}
