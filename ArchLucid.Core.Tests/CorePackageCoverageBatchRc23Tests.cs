using ArchLucid.Core.Ask;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Notifications;
using ArchLucid.Core.Secrets;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc23Tests
{
    [Fact]
    public async Task NullUsageMeteringService_completes_record_and_summary_paths()
    {
        NullUsageMeteringService sut = new();
        UsageEvent usageEvent = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = DateTimeOffset.UtcNow,
        };

        await sut.RecordAsync(usageEvent, CancellationToken.None);
        await sut.RecordBatchAsync([usageEvent], CancellationToken.None);

        IReadOnlyList<TenantUsageSummary> summaries = await sut.GetSummaryAsync(
            usageEvent.TenantId,
            DateTimeOffset.UtcNow.AddDays(-1),
            DateTimeOffset.UtcNow,
            CancellationToken.None);

        summaries.Should().BeEmpty();
    }

    [Fact]
    public async Task DisabledAsyncAuthorityPipelineModeResolver_never_queues_stages()
    {
        DisabledAsyncAuthorityPipelineModeResolver sut = new();

        bool shouldQueue = await sut.ShouldQueueContextAndGraphStagesAsync(CancellationToken.None);

        shouldQueue.Should().BeFalse();
    }

    [Fact]
    public void AskRequest_and_AskResponse_round_trip_properties()
    {
        Guid threadId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid baseRunId = Guid.NewGuid();
        Guid targetRunId = Guid.NewGuid();

        AskRequest request = new()
        {
            ThreadId = threadId,
            RunId = runId,
            BaseRunId = baseRunId,
            TargetRunId = targetRunId,
            Question = "What changed?",
        };

        AskResponse response = new()
        {
            ThreadId = threadId,
            Answer = "Two topology nodes moved.",
            ReferencedDecisions = ["dec-1"],
            ReferencedFindings = ["find-1"],
            ReferencedArtifacts = ["artifact-1"],
            ComparisonNarrative = "Delta summary.",
            RetrievalDegraded = true,
        };

        request.ThreadId.Should().Be(threadId);
        request.Question.Should().Be("What changed?");
        response.Answer.Should().Contain("topology");
        response.RetrievalDegraded.Should().BeTrue();
    }

    [Fact]
    public void BillingConversionBlockedException_preserves_message()
    {
        BillingConversionBlockedException ex = new("Billing activation required.");

        ex.Message.Should().Be("Billing activation required.");
    }

    [Fact]
    public void Configuration_and_record_types_expose_defaults()
    {
        LlmTelemetryOptions telemetry = new();
        ArchLucid.Core.Metering.MeteringOptions metering = new();
        ArchLucidSecretOptions secrets = new();
        TenantHardPurgeOptions purge = new();
        TrialFirstManifestCommitOutcome trialOutcome = new();

        telemetry.RecordPerTenantTokens.Should().BeFalse();
        metering.Enabled.Should().BeFalse();
        secrets.Provider.Should().Be(SecretProviderKind.EnvironmentVariable);
        purge.DryRun.Should().BeFalse();
        trialOutcome.SignupToCommitSeconds.Should().Be(0);
    }

    [Fact]
    public void Explanation_and_identity_record_types_round_trip()
    {
        DecisionTraceEntry trace = new() { Kind = "ruleAudit", Description = "validated" };
        FindingRationale rationale = new() { FindingId = "f-1", Rationale = "risk" };
        FindingTraceCompletenessScore completeness = new()
        {
            FindingId = "f-1",
            CompletenessRatio = 0.9,
            MissingTraceFields = ["citation"],
        };
        RunRationale runRationale = new() { RunId = Guid.NewGuid(), Summary = "complete" };
        TrialIdentityUserRecord user = new()
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            NormalizedEmail = "USER@EXAMPLE.COM",
            PasswordHash = "hash",
            SecurityStamp = "stamp",
            ConcurrencyStamp = "concurrency",
        };
        SentEmailLedgerEntry ledger = new("msg-1", Guid.NewGuid(), "welcome", "smtp", "provider-id");
        TenantHardPurgeResult purgeResult = new() { RowsDeleted = 3 };

        trace.Kind.Should().Be("ruleAudit");
        rationale.FindingId.Should().Be("f-1");
        completeness.MissingTraceFields.Should().ContainSingle();
        runRationale.Summary.Should().Be("complete");
        user.NormalizedEmail.Should().Be("USER@EXAMPLE.COM");
        ledger.TemplateId.Should().Be("welcome");
        purgeResult.RowsDeleted.Should().Be(3);
    }

    [Fact]
    public void OutboxDepthGaugeValues_stores_all_depth_fields()
    {
        OutboxDepthGaugeValues values = new(
            AuthorityPipelineWorkPending: 1,
            AuthorityPipelineWorkOldestPendingAgeSeconds: 2.5,
            RetrievalIndexingOutboxPending: 3,
            RetrievalIndexingOutboxOldestPendingAgeSeconds: 4.5,
            RetrievalIndexingOutboxDeadLetter: 5,
            IntegrationEventOutboxPublishPending: 6,
            IntegrationEventOutboxDeadLetter: 7,
            IntegrationEventOutboxOldestActionablePendingAgeSeconds: 8.5,
            AuthorityPipelineWorkDeadLetter: 9,
            RunExportBlobPushOutboxPending: 10,
            RunExportBlobPushOutboxOldestPendingAgeSeconds: 11.5,
            RunExportBlobPushOutboxDeadLetter: 12,
            PostCommitProjectionOutboxPending: 13,
            PostCommitProjectionOutboxOldestPendingAgeSeconds: 14.5,
            PostCommitProjectionOutboxDeadLetter: 15);

        values.AuthorityPipelineWorkPending.Should().Be(1);
        values.PostCommitProjectionOutboxDeadLetter.Should().Be(15);
    }
}
