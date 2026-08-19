using System.Diagnostics;

using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Retrieval;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;
using ArchLucid.Retrieval.Indexing;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Composition.Tests.Coordination;

[Trait("Suite", "Core")]
public sealed class RetrievalIndexingOutboxProcessorCorrelationTests
{
    [Fact]
    public async Task ProcessPendingBatchAsync_starts_activity_with_correlation_tags()
    {
        List<Activity> stopped = [];
        using ActivityListener listener = new();
        listener.ShouldListenTo = s => s.Name == ArchLucidMeterNames.RetrievalIndexingOutboxActivitySource;
        listener.Sample = (ref _) => ActivitySamplingResult.AllDataAndRecorded;
        listener.ActivityStopped = stopped.Add;
        ActivitySource.AddActivityListener(listener);

        Guid outboxId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Mock<IRetrievalIndexingOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalIndexingOutboxEntry
                {
                    OutboxId = outboxId,
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ]);
        outbox.Setup(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        Mock<IAuthorityQueryService> query = new();
        query
            .Setup(q => q.GetRunDetailForRetrievalIndexingAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => query.Object);
        services.AddScoped(_ => Mock.Of<IArtifactQueryService>());
        services.AddScoped(_ => Mock.Of<IRetrievalRunCompletionIndexer>());
        services.AddScoped(_ => Mock.Of<IProvenanceBuilder>());
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory factory = provider.GetRequiredService<IServiceScopeFactory>();

        RetrievalIndexingOutboxProcessor sut = new(
            factory,
            Options.Create(new RetrievalIndexingOutboxProcessorOptions()),
            TimeProvider.System,
            NullLogger<RetrievalIndexingOutboxProcessor>.Instance);
        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        stopped.Should().ContainSingle(a => a.OperationName == "RetrievalIndexingOutbox.ProcessEntry");
        Activity entryActivity = stopped.Single(a => a.OperationName == "RetrievalIndexingOutbox.ProcessEntry");
        entryActivity.GetTagItem(ActivityCorrelation.LogicalCorrelationIdTag).Should()
            .Be($"retrieval-outbox:{outboxId:D}");
        entryActivity.GetTagItem("archlucid.outbox_id").Should().Be(outboxId.ToString("D"));
        entryActivity.GetTagItem("archlucid.run_id").Should().Be(runId.ToString("D"));
        entryActivity.GetTagItem(ActivityScopeTags.TenantIdTag).Should().Be(tenantId.ToString("D"));
        entryActivity.GetTagItem(ActivityScopeTags.WorkspaceIdTag).Should().Be(workspaceId.ToString("D"));
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_pushes_ambient_scope_before_indexing()
    {
        Guid outboxId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        ScopeContext? ambientDuringIndex = null;
        Mock<IRetrievalIndexingOutboxRepository> outbox = new();
        outbox
            .Setup(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalIndexingOutboxEntry
                {
                    OutboxId = outboxId,
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ]);
        outbox.Setup(o => o.MarkProcessedAsync(outboxId, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        ManifestDocument manifest = new()
        {
            ManifestId = Guid.NewGuid(),
            RunId = runId,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ManifestHash = "hash",
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "hash-rules",
        };

        Guid graphSnapshotId = Guid.NewGuid();
        string projectSlug = "retrieval-index-test";

        RunDetailDto detail = new()
        {
            Run = new RunRecord
            {
                RunId = runId,
                ScopeProjectId = projectId,
                ProjectId = projectSlug,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            GoldenManifest = manifest,
            GraphSnapshot = new GraphSnapshot
            {
                GraphSnapshotId = graphSnapshotId,
                ContextSnapshotId = Guid.NewGuid(),
                RunId = runId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            FindingsSnapshot = new FindingsSnapshot { FindingsSnapshotId = Guid.NewGuid(), RunId = runId, Findings = [] },
            AuthorityTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload()),
        };

        Mock<IAuthorityQueryService> query = new();
        query
            .Setup(q => q.GetRunDetailForRetrievalIndexingAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IArtifactQueryService> artifactQuery = new();
        artifactQuery
            .Setup(q => q.GetArtifactsByManifestIdAsync(It.IsAny<ScopeContext>(), manifest.ManifestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IProvenanceBuilder> provenanceBuilder = new();
        provenanceBuilder
            .Setup(p => p.Build(It.IsAny<ProvenanceBuildInput>()))
            .Returns(new DecisionProvenanceGraph());

        Mock<IRetrievalRunCompletionIndexer> indexer = new();
        indexer
            .Setup(i => i.IndexAuthorityRunAsync(
                tenantId,
                workspaceId,
                projectId,
                It.IsAny<ManifestDocument>(),
                It.IsAny<IReadOnlyList<SynthesizedArtifact>>(),
                It.IsAny<DecisionProvenanceGraph>(),
                It.IsAny<FindingsSnapshot>(),
                It.IsAny<GraphSnapshot>(),
                It.IsAny<CancellationToken>()))
            .Callback(() => ambientDuringIndex = AmbientScopeContext.CurrentOverride)
            .Returns(Task.CompletedTask);

        ServiceCollection services = [];
        services.AddScoped(_ => outbox.Object);
        services.AddScoped(_ => query.Object);
        services.AddScoped(_ => artifactQuery.Object);
        services.AddScoped(_ => indexer.Object);
        services.AddScoped(_ => provenanceBuilder.Object);
        ServiceProvider provider = services.BuildServiceProvider();
        IServiceScopeFactory factory = provider.GetRequiredService<IServiceScopeFactory>();

        RetrievalIndexingOutboxProcessor sut = new(
            factory,
            Options.Create(new RetrievalIndexingOutboxProcessorOptions()),
            TimeProvider.System,
            NullLogger<RetrievalIndexingOutboxProcessor>.Instance);
        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        ambientDuringIndex.Should().NotBeNull();
        ambientDuringIndex!.TenantId.Should().Be(tenantId);
        ambientDuringIndex.WorkspaceId.Should().Be(workspaceId);
        ambientDuringIndex.ProjectId.Should().Be(projectId);
    }
}
