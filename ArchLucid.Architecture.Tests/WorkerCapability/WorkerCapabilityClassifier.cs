namespace ArchLucid.Architecture.Tests.WorkerCapability;

/// <summary>Maps hosted-service types to OP-01 capability ids for the worker ownership map.</summary>
internal static class WorkerCapabilityClassifier
{
    private static readonly (string Suffix, string Capability)[] SuffixRules =
    [
        ("ExtractorAutoPullHostedService", "infra-evidence"),
        ("WarmTenantCatalogReplenishHostedService", "infra-evidence"),
    ];

    private static readonly Dictionary<string, string> TypeNameOverrides = new(StringComparer.Ordinal)
    {
        ["ArchLucid.Application.Evidence.EvidenceAddedIncrementalReReviewHostedService"] = "governance",
        ["ArchLucid.Application.Findings.FindingEngineRegistrationDistinctnessHostedService"] = "governance",
        ["ArchLucid.Application.Planning.AdvisoryDraft.AdvisoryDraftOperationHostedService"] = "authority",
        ["ArchLucid.Application.DataConsistency.DataConsistencyReconciliationHostedService"] = "platform",
        ["ArchLucid.Decisioning.Hosting.FindingEngineRegistrationDistinctnessHostedService"] = "governance",
        ["ArchLucid.Application.Runs.Async.ArchitectureRunAsyncOperationHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.AdvisoryScanHostedService"] = "governance",
        ["ArchLucid.Host.Core.Hosted.ArchitectureReviewRecurrenceHostedService"] = "governance",
        ["ArchLucid.Host.Core.Hosted.ComplianceDriftEscalationHostedService"] = "governance",
        ["ArchLucid.Host.Core.Hosted.ExecDigestWeeklyHostedService"] = "governance",
        ["ArchLucid.Host.Core.Hosted.SponsorDigestWeeklyHostedService"] = "governance",
        ["ArchLucid.Host.Core.Hosted.WeeklyArchitectureDigestHostedService"] = "governance",
        ["ArchLucid.Host.Core.Hosted.WeeklyExecutiveSummaryHostedService"] = "governance",
        ["ArchLucid.Host.Core.Hosted.WeeklySponsorReportHostedService"] = "governance",
        ["ArchLucid.Host.Core.Hosted.WeeklySponsorSummaryHostedService"] = "governance",
        ["ArchLucid.Host.Core.Hosted.WaiverExpiryNotificationHostedService"] = "governance",
        ["ArchLucid.Host.Core.Hosted.AuthorityPipelineWorkHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.RetrievalIndexingOutboxHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.RunExportBlobPushOutboxHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.PostCommitProjectionOutboxHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.CosmosGraphSnapshotOutboxHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.AgentResultBlobCleanupHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.ArchitectureProjectRetentionPurgeHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.SampleRunTtlHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.DraftIntakeReaperHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.SponsorRoiCacheWarmupHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.SponsorRoiSavingsGaugeHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.HungReviewExecuteWatchdogHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.RunExecuteOwnershipReconciliationHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.RunExecuteOwnershipShutdownReleaseHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.StaleInFlightAutoRemediationHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.MissingArchitectureRequestAutoRemediationHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.StaleInFlightRunMetricsHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.RetrievalEmbeddingDriftStartupValidator"] = "authority",
        ["ArchLucid.Host.Core.Hosted.PolicyPackCorpusStartupIndexerHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.PlatformDocCorpusStartupIndexerHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.ExemplarCorpusStartupIndexerHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.AzureExtractorAutoPullHostedService"] = "infra-evidence",
        ["ArchLucid.Host.Core.Hosted.AwsExtractorAutoPullHostedService"] = "infra-evidence",
        ["ArchLucid.Host.Core.Hosted.GcpExtractorAutoPullHostedService"] = "infra-evidence",
        ["ArchLucid.Host.Core.Hosted.AuditRetryDrainHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.LlmCostEstimationUsdRateOverrideWarmupHostedService"] = "authority",
        ["ArchLucid.Host.Core.Hosted.IntegrationEventOutboxHostedService"] = "platform",
        ["ArchLucid.Host.Core.Hosted.IntegrationEventDlqRetryHostedService"] = "platform",
        ["ArchLucid.Host.Core.Hosted.OutboxOperationalMetricsHostedService"] = "platform",
    };

    internal static string Classify(Type hostedServiceType)
    {
        ArgumentNullException.ThrowIfNull(hostedServiceType);

        string fullName = hostedServiceType.FullName
                          ?? throw new InvalidOperationException($"Hosted service type {hostedServiceType.Name} has no full name.");

        if (TypeNameOverrides.TryGetValue(fullName, out string? capability))
            return capability;

        string typeName = hostedServiceType.Name;

        foreach ((string suffix, string suffixCapability) in SuffixRules)
        {
            if (typeName.EndsWith(suffix, StringComparison.Ordinal))
                return suffixCapability;
        }

        if ((typeName.Contains("Outbox", StringComparison.Ordinal)
             && !typeName.Contains("IntegrationEvent", StringComparison.Ordinal)
             && !typeName.Contains("OutboxOperational", StringComparison.Ordinal))
            || typeName.Contains("Pipeline", StringComparison.Ordinal)
            || typeName.Contains("RunExecute", StringComparison.Ordinal)
            || typeName.Contains("Review", StringComparison.Ordinal)
            || typeName.Contains("DraftIntake", StringComparison.Ordinal)
            || typeName.Contains("ArchitectureRun", StringComparison.Ordinal)
            || typeName.Contains("Retrieval", StringComparison.Ordinal)
            || typeName.Contains("SponsorRoi", StringComparison.Ordinal))
        {
            return "authority";
        }

        if (typeName.Contains("Extractor", StringComparison.Ordinal)
            || typeName.Contains("Inventory", StringComparison.Ordinal))
        {
            return "infra-evidence";
        }

        if (typeName.Contains("Compliance", StringComparison.Ordinal)
            || typeName.Contains("Waiver", StringComparison.Ordinal)
            || typeName.Contains("Advisory", StringComparison.Ordinal)
            || typeName.Contains("Digest", StringComparison.Ordinal)
            || typeName.Contains("Finding", StringComparison.Ordinal)
            || typeName.Contains("ReReview", StringComparison.Ordinal))
        {
            return "governance";
        }

        return "platform";
    }
}
