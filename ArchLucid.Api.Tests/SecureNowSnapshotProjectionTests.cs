using ArchLucid.Api.Controllers.Planning;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SecureNowSnapshotProjectionTests
{
    private static readonly Guid Run = Guid.Parse("44444444-4444-4444-8444-444444444444");
    private static readonly DateTimeOffset Now = DateTimeOffset.Parse("2026-11-22T09:00:00Z");
    private static ScopeContext Scope() => new()
    {
        TenantId = Guid.Parse("11111111-1111-4111-8111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-4222-8222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-4333-8333-333333333333")
    };

    private static GraphSnapshot Graph() => new()
    {
        SchemaVersion = 1,
        RunId = Run,
        GraphSnapshotId = Guid.NewGuid(),
        ContextSnapshotId = Guid.NewGuid(),
        CreatedUtc = DateTime.Parse("2026-11-22T08:00:00Z").ToUniversalTime(),
        Nodes = [new GraphNode { NodeId = "n1", NodeType = "resource", Label = "Resource" }],
        Warnings = ["partial collection"]
    };

    [Fact]
    public void Authorized_projection_preserves_scope_and_lineage_without_mutation()
    {
        GraphSnapshot graph = Graph();
        ScopeContext scope = Scope();
        SecureNowSnapshotEnvelope result = SecureNowSnapshotProjection.Project(graph, scope, Run, Now);
        result.TenantId.Should().Be(scope.TenantId);
        result.Lineage.ContextSnapshotId.Should().Be(graph.ContextSnapshotId);
        result.Lineage.SourceEvidenceRefs.Should().BeEmpty();
        result.Freshness.Status.Should().Be("unknown");
        result.ReadOnly.Should().BeTrue();
        result.Warnings.Should().ContainSingle().Which.Should().Be("partial collection");
        graph.Nodes.Should().ContainSingle();
    }

    [Fact]
    public void Freshness_is_explicit()
    {
        SecureNowSnapshotProjection.Project(Graph(), Scope(), Run, Now, TimeSpan.FromHours(1))
            .Freshness.Status.Should().Be("current");
        SecureNowSnapshotProjection.Project(Graph(), Scope(), Run, Now, TimeSpan.FromMinutes(59))
            .Freshness.Status.Should().Be("stale");
    }

    [Fact]
    public void Missing_authenticated_scope_fails_closed()
    {
        ScopeContext scope = Scope();
        scope.TenantId = Guid.Empty;
        Action action = () => SecureNowSnapshotProjection.Project(Graph(), scope, Run, Now);
        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Cross_run_snapshot_is_rejected()
    {
        Action action = () => SecureNowSnapshotProjection.Project(Graph(), Scope(), Guid.NewGuid(), Now);
        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Dangling_graph_edge_is_rejected()
    {
        GraphSnapshot graph = Graph();
        graph.Edges = [new GraphEdge { FromNodeId = "n1", ToNodeId = "other", EdgeType = "RELATES_TO" }];
        Action action = () => SecureNowSnapshotProjection.Project(graph, Scope(), Run, Now);
        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Future_capture_is_rejected()
    {
        GraphSnapshot graph = Graph();
        graph.CreatedUtc = Now.AddHours(1).UtcDateTime;
        Action action = () => SecureNowSnapshotProjection.Project(graph, Scope(), Run, Now);
        action.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Unsupported_graph_version_is_rejected()
    {
        GraphSnapshot graph = Graph();
        graph.SchemaVersion = 2;
        Action action = () => SecureNowSnapshotProjection.Project(graph, Scope(), Run, Now);
        action.Should().Throw<ArgumentException>();
    }
}
