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
        repo.Verify(
            r => r.GetLatestByContextSnapshotIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryResolveAsync_skips_orphan_reuse_when_run_header_graph_id_is_null()
    {
        Guid runId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };

        Mock<IGraphSnapshotRepository> repo = new();

        GraphSnapshotResolutionResult? result = await GraphSnapshotCommittedReuseResolver.TryResolveAsync(
            scope,
            runId,
            runGraphSnapshotId: null,
            contextId,
            repo.Object,
            CancellationToken.None);

        result.Should().BeNull();
        repo.Verify(
            r => r.GetLatestByContextSnapshotIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryResolveAsync_reuses_orphan_graph_when_header_points_to_missing_graph()
    {
        Guid runId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid staleHeaderId = Guid.NewGuid();
        GraphSnapshot orphan = new()
        {
            GraphSnapshotId = graphId,
            RunId = runId,
            ContextSnapshotId = contextId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime()
        };

        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };

        Mock<IGraphSnapshotRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(scope, staleHeaderId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((GraphSnapshot?)null);
        repo
            .Setup(r => r.GetLatestByContextSnapshotIdAsync(scope, contextId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(orphan);

        GraphSnapshotResolutionResult? result = await GraphSnapshotCommittedReuseResolver.TryResolveAsync(
            scope,
            runId,
            staleHeaderId,
            contextId,
            repo.Object,
            CancellationToken.None);

        result.Should().NotBeNull();
        result!.ResolutionMode.Should().Be("reused_from_orphan_save");
        result.Snapshot.GraphSnapshotId.Should().Be(graphId);
    }
}
