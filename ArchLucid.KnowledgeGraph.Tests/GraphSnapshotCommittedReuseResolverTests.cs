using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class GraphSnapshotCommittedReuseResolverTests
{
    [Fact]
    public async Task TryResolveAsync_reuses_graph_from_run_header_when_load_succeeds()
    {
        Guid runId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        GraphSnapshot stored = new()
        {
            GraphSnapshotId = graphId,
            RunId = runId,
            ContextSnapshotId = contextId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        Mock<IGraphSnapshotRepository> repo = new();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        repo.Setup(r => r.GetByIdAsync(scope, graphId, It.IsAny<CancellationToken>())).ReturnsAsync(stored);

        GraphSnapshotResolutionResult? result = await GraphSnapshotCommittedReuseResolver.TryResolveAsync(
            scope,
            runId,
            graphId,
            contextId,
            repo.Object,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.ResolutionMode.Should().Be("reused_from_run_header");
        result.Snapshot.GraphSnapshotId.Should().Be(graphId);
        repo.Verify(r => r.GetLatestByContextSnapshotIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task TryResolveAsync_reuses_orphan_graph_for_run_when_header_fk_missing()
    {
        Guid runId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        GraphSnapshot orphan = new()
        {
            GraphSnapshotId = graphId,
            RunId = runId,
            ContextSnapshotId = contextId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        Mock<IGraphSnapshotRepository> repo = new();
        repo
            .Setup(r => r.GetLatestByContextSnapshotIdAsync(contextId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(orphan);

        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };

        GraphSnapshotResolutionResult? result = await GraphSnapshotCommittedReuseResolver.TryResolveAsync(
            scope,
            runId,
            runGraphSnapshotId: null,
            contextId,
            repo.Object,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.ResolutionMode.Should().Be("reused_from_orphan_save");
        result.Snapshot.GraphSnapshotId.Should().Be(graphId);
    }
}
