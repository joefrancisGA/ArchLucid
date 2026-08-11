using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Persistence.Graph;
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

/// <summary>
/// **TB-993:** retrieval indexing outbox replay must converge via upsert semantics on <see cref="IRetrievalRunCompletionIndexer" />.
/// </summary>
[Trait("Suite", "Core")]
public sealed class RetrievalIndexingOutboxProcessorReplayIdempotencyTests
{
    [Fact]
    public async Task ProcessPendingBatchAsync_reindexes_same_run_when_a_second_pending_row_is_drained()
    {
        Guid firstOutboxId = Guid.NewGuid();
        Guid secondOutboxId = Guid.NewGuid();
        Guid runId = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        int indexInvocationCount = 0;

        Mock<IRetrievalIndexingOutboxRepository> outbox = new();
        outbox
            .SetupSequence(o => o.DequeuePendingAsync(25, It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new RetrievalIndexingOutboxEntry
                {
                    OutboxId = firstOutboxId,
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ])
            .ReturnsAsync(
            [
                new RetrievalIndexingOutboxEntry
                {
                    OutboxId = secondOutboxId,
                    RunId = runId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    CreatedUtc = TimeProvider.System.UtcNowDateTime()
                }
            ])
            .ReturnsAsync(Array.Empty<RetrievalIndexingOutboxEntry>());

        outbox.Setup(o => o.MarkProcessedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        RunDetailDto detail = BuildRunDetail(runId, tenantId, workspaceId, projectId);

        Mock<IAuthorityQueryService> query = new();
        query
            .Setup(q => q.GetRunDetailForRetrievalIndexingAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IArtifactQueryService> artifactQuery = new();
        artifactQuery
            .Setup(q => q.GetArtifactsByManifestIdAsync(It.IsAny<ScopeContext>(), detail.GoldenManifest!.ManifestId, It.IsAny<CancellationToken>()))
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
            .Callback(() => indexInvocationCount++)
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
        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        indexInvocationCount.Should().Be(2, "at-least-once drain may index the same run twice; indexer upsert must converge");
        outbox.Verify(o => o.MarkProcessedAsync(firstOutboxId, It.IsAny<CancellationToken>()), Times.Once);
        outbox.Verify(o => o.MarkProcessedAsync(secondOutboxId, It.IsAny<CancellationToken>()), Times.Once);
    }

    private static RunDetailDto BuildRunDetail(Guid runId, Guid tenantId, Guid workspaceId, Guid projectId)
    {
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

        return new RunDetailDto
        {
            Run = new RunRecord
            {
                RunId = runId,
                ScopeProjectId = projectId,
                ProjectId = "replay-test",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            GoldenManifest = manifest,
            GraphSnapshot = new GraphSnapshot
            {
                GraphSnapshotId = Guid.NewGuid(),
                ContextSnapshotId = Guid.NewGuid(),
                RunId = runId,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            },
            FindingsSnapshot = new FindingsSnapshot { FindingsSnapshotId = Guid.NewGuid(), RunId = runId, Findings = [] },
            AuthorityTrace = RuleAuditTraceDto.From(new RuleAuditTracePayload()),
        };
    }
}
