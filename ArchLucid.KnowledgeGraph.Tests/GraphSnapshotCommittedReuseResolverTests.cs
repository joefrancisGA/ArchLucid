using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Persistence.Context;
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
        ContextSnapshot contextSnapshot = BuildContextSnapshot(contextId);
        ArchitectureKnowledgeModel knowledgeModel = BuildKnowledgeModel();
        GraphSnapshot stored = BuildGraphWithContextPins(contextId, runId, graphId, contextSnapshot, knowledgeModel);

        Mock<IGraphSnapshotRepository> repo = new();
        ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = Guid.NewGuid(), ProjectId = Guid.NewGuid() };
        repo.Setup(r => r.GetByIdAsync(scope, graphId, It.IsAny<CancellationToken>())).ReturnsAsync(stored);

        GraphSnapshotResolutionResult? result = await GraphSnapshotCommittedReuseResolver.TryResolveAsync(
            scope,
            runId,
            graphId,
            contextId,
            repo.Object,
            CancellationToken.None,
            contextSnapshot: contextSnapshot,
            knowledgeModel: knowledgeModel);

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
        ContextSnapshot contextSnapshot = BuildContextSnapshot(contextId);
        ArchitectureKnowledgeModel knowledgeModel = BuildKnowledgeModel();
        GraphSnapshot orphan = BuildGraphWithContextPins(contextId, runId, graphId, contextSnapshot, knowledgeModel);

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
            CancellationToken.None,
            contextSnapshot: contextSnapshot,
            knowledgeModel: knowledgeModel);

        result.Should().NotBeNull();
        result!.ResolutionMode.Should().Be("reused_from_orphan_save");
        result.Snapshot.GraphSnapshotId.Should().Be(graphId);
    }

    private static ContextSnapshot BuildContextSnapshot(Guid contextSnapshotId)
    {
        return new ContextSnapshot
        {
            SnapshotId = contextSnapshotId,
            RunId = Guid.NewGuid(),
            ProjectId = "proj",
            CreatedUtc = DateTime.UtcNow,
            CanonicalObjects =
            [
                new CanonicalObject
                {
                    ObjectId = "a",
                    ObjectType = "type",
                    Name = "A",
                    SourceType = "src",
                    SourceId = "1",
                },
            ],
        };
    }

    private static ArchitectureKnowledgeModel BuildKnowledgeModel()
    {
        DateTime utcNow = DateTime.UtcNow;

        return new ArchitectureKnowledgeModel
        {
            ModelId = "km-test",
            TenantId = "tenant-test",
            SchemaVersion = 1,
            CreatedUtc = utcNow,
            UpdatedUtc = utcNow,
            Elements = [],
        };
    }

    private static GraphSnapshot BuildGraphWithContextPins(
        Guid contextSnapshotId,
        Guid runId,
        Guid graphId,
        ContextSnapshot contextSnapshot,
        ArchitectureKnowledgeModel knowledgeModel)
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            ["contextCanonicalFingerprint"] = GraphSnapshotCanonicalFingerprint.Compute(contextSnapshot),
            ["knowledgeModelFingerprint"] =
                GraphSnapshotCanonicalFingerprint.ComputeKnowledgeModelFingerprint(knowledgeModel),
        };

        return new GraphSnapshot
        {
            GraphSnapshotId = graphId,
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "ctx",
                    NodeType = "ContextSnapshot",
                    Label = "Context",
                    Properties = properties,
                },
            ],
        };
    }
}
