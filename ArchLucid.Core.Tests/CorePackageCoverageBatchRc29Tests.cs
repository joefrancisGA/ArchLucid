using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Ask;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Metering;
using ArchLucid.Core.Requests;

using FluentAssertions;

namespace ArchLucid.Core.Tests;

/// <summary>RC29 package-coverage batch: Ask DTOs, authority resolver, metering no-op, audit retry queue, request classifier.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CorePackageCoverageBatchRc29Tests
{
    private static readonly DateTimeOffset SampleUtc = new(2026, 4, 1, 12, 0, 0, TimeSpan.Zero);
    [Fact]
    public void AskRequest_and_AskResponse_roundtrip_property_bags()
    {
        Guid threadId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();

        AskRequest request = new()
        {
            ThreadId = threadId,
            RunId = runId,
            BaseRunId = Guid.NewGuid(),
            TargetRunId = Guid.NewGuid(),
            Question = "What changed between runs?"
        };

        AskResponse response = new()
        {
            ThreadId = threadId,
            Answer = "Summary",
            ReferencedDecisions = ["dec-1"],
            ReferencedFindings = ["finding-1"],
            ReferencedArtifacts = ["artifact-1"],
            ComparisonNarrative = "Delta narrative",
            RetrievalDegraded = true
        };

        request.Question.Should().Contain("changed");
        response.ReferencedDecisions.Should().ContainSingle("dec-1");
        response.RetrievalDegraded.Should().BeTrue();
    }

    [Fact]
    public async Task DisabledAsyncAuthorityPipelineModeResolver_never_queues_stages()
    {
        DisabledAsyncAuthorityPipelineModeResolver resolver = new();

        (await resolver.ShouldQueueContextAndGraphStagesAsync()).Should().BeFalse();
    }

    [Fact]
    public void BillingConversionBlockedException_preserves_message()
    {
        BillingConversionBlockedException ex = new("billing blocked");

        ex.Message.Should().Be("billing blocked");
    }

    [Fact]
    public async Task NullUsageMeteringService_completes_without_recording()
    {
        NullUsageMeteringService service = new();
        UsageEvent usageEvent = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = SampleUtc
        };

        await service.RecordAsync(usageEvent, CancellationToken.None);
        await service.RecordBatchAsync([usageEvent], CancellationToken.None);

        IReadOnlyList<TenantUsageSummary> summary = await service.GetSummaryAsync(
            usageEvent.TenantId,
            SampleUtc.AddDays(-1),
            SampleUtc,
            CancellationToken.None);

        summary.Should().BeEmpty();
    }

    [Fact]
    public async Task InMemoryAuditRetryQueue_enqueues_and_drains_events()
    {
        InMemoryAuditRetryQueue queue = new(capacity: 4);
        AuditEvent auditEvent = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            EventType = "unit.test",
            ActorUserId = "actor-1",
            ActorUserName = "Actor",
            DataJson = "{}"
        };

        queue.TryEnqueue(auditEvent).Should().BeTrue();
        queue.ApproximatePendingCount.Should().Be(1);

        AuditEvent dequeued = await queue.DequeueAsync(CancellationToken.None);
        dequeued.EventType.Should().Be("unit.test");
        queue.ApproximatePendingCount.Should().Be(1);
    }

    [Fact]
    public void RequestConstraintClassifier_detects_constraints_and_capabilities()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "req-1",
            SystemName = "Harness",
            Constraints = ["require managed identity", "private endpoint only", "encryption at rest"],
            RequiredCapabilities = ["azure search", "openai inference", "sql database"]
        };

        RequestConstraintClassifier.HasManagedIdentityConstraint(request).Should().BeTrue();
        RequestConstraintClassifier.HasPrivateNetworkingConstraint(request).Should().BeTrue();
        RequestConstraintClassifier.HasEncryptionConstraint(request).Should().BeTrue();
        RequestConstraintClassifier.RequiresSearchCapability(request).Should().BeTrue();
        RequestConstraintClassifier.RequiresAiCapability(request).Should().BeTrue();
        RequestConstraintClassifier.RequiresSqlCapability(request).Should().BeTrue();
    }
}
