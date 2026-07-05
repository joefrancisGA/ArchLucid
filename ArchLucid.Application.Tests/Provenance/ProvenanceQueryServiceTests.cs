using ArchLucid.Application.Provenance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;
using ArchLucid.Provenance.Services;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Provenance;

[Trait("Category", "Unit")]
public sealed class ProvenanceQueryServiceTests
{
    [Fact]
    public async Task GetFullGraphAsync_returns_null_when_run_detail_missing()
    {
        ScopeContext scope = NewScope();
        Guid runId = Guid.NewGuid();
        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunDetailDto?)null);

        ProvenanceQueryService sut = new(authority.Object, Mock.Of<IProvenanceGraphAccessService>());

        GraphViewModel? graph = await sut.GetFullGraphAsync(scope, runId, CancellationToken.None);

        graph.Should().BeNull();
    }

    [Fact]
    public async Task GetFullGraphAsync_throws_for_empty_run_id()
    {
        ProvenanceQueryService sut = new(Mock.Of<IAuthorityQueryService>(), Mock.Of<IProvenanceGraphAccessService>());

        Func<Task> act = async () => await sut.GetFullGraphAsync(NewScope(), Guid.Empty, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task GetDecisionSubgraphAsync_returns_null_when_decision_key_unknown()
    {
        ScopeContext scope = NewScope();
        Guid runId = Guid.NewGuid();
        RunDetailDto detail = new() { Run = new RunRecord { RunId = runId } };
        DecisionProvenanceGraph graph = new()
        {
            Nodes =
            [
                new ProvenanceNode
                {
                    Id = Guid.NewGuid(),
                    Name = "node",
                    Type = ProvenanceNodeType.Decision,
                    ReferenceId = "known-key",
                },
            ],
        };

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IProvenanceGraphAccessService> graphAccess = new();
        graphAccess.Setup(g => g.ResolveGraphAsync(scope, detail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(graph);

        ProvenanceQueryService sut = new(authority.Object, graphAccess.Object);

        GraphViewModel? result = await sut.GetDecisionSubgraphAsync(scope, runId, "missing-key", CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetNodeNeighborhoodAsync_returns_null_when_node_not_in_graph()
    {
        ScopeContext scope = NewScope();
        Guid runId = Guid.NewGuid();
        Guid nodeId = Guid.NewGuid();
        RunDetailDto detail = new() { Run = new RunRecord { RunId = runId } };
        DecisionProvenanceGraph graph = new()
        {
            Nodes =
            [
                new ProvenanceNode
                {
                    Id = Guid.NewGuid(),
                    Name = "other",
                    Type = ProvenanceNodeType.Decision,
                    ReferenceId = "other-key",
                },
            ],
        };

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IProvenanceGraphAccessService> graphAccess = new();
        graphAccess.Setup(g => g.ResolveGraphAsync(scope, detail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(graph);

        ProvenanceQueryService sut = new(authority.Object, graphAccess.Object);

        GraphViewModel? result = await sut.GetNodeNeighborhoodAsync(scope, runId, nodeId, depth: 2, CancellationToken.None);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetNodeNeighborhoodAsync_clamps_depth_to_supported_range()
    {
        ScopeContext scope = NewScope();
        Guid runId = Guid.NewGuid();
        Guid nodeId = Guid.NewGuid();
        Guid childId = Guid.NewGuid();
        RunDetailDto detail = new() { Run = new RunRecord { RunId = runId } };
        DecisionProvenanceGraph graph = new()
        {
            RunId = runId,
            Nodes =
            [
                new ProvenanceNode
                {
                    Id = nodeId,
                    Name = "root",
                    Type = ProvenanceNodeType.Decision,
                    ReferenceId = "root-key",
                },
                new ProvenanceNode
                {
                    Id = childId,
                    Name = "child",
                    Type = ProvenanceNodeType.Finding,
                    ReferenceId = "child-ref",
                },
            ],
            Edges =
            [
                new ProvenanceEdge
                {
                    Id = Guid.NewGuid(),
                    FromNodeId = nodeId,
                    ToNodeId = childId,
                    Type = ProvenanceEdgeType.SupportedBy,
                },
            ],
        };

        Mock<IAuthorityQueryService> authority = new();
        authority.Setup(a => a.GetRunDetailAsync(scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(detail);

        Mock<IProvenanceGraphAccessService> graphAccess = new();
        graphAccess.Setup(g => g.ResolveGraphAsync(scope, detail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(graph);

        ProvenanceQueryService sut = new(authority.Object, graphAccess.Object);

        GraphViewModel? shallow = await sut.GetNodeNeighborhoodAsync(scope, runId, nodeId, depth: 0, CancellationToken.None);
        GraphViewModel? deep = await sut.GetNodeNeighborhoodAsync(scope, runId, nodeId, depth: 99, CancellationToken.None);

        shallow.Should().NotBeNull();
        deep.Should().NotBeNull();
        shallow!.NodeCount.Should().BeGreaterThan(0);
        deep!.NodeCount.Should().BeGreaterThan(0);
    }

    private static ScopeContext NewScope()
    {
        return new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
    }
}
