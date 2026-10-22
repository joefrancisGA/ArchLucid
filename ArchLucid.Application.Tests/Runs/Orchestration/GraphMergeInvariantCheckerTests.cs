using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Suite", "Core")]
public sealed class GraphMergeInvariantCheckerTests
{
    [Fact]
    public void Clean_graph_has_no_violations()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-a",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "a",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Inventory",
                    SourceId = "svc-a",
                }
            ],
            Edges = [],
            Warnings = [],
        };

        GraphMergeInvariantChecker.Check(graph).Should().BeEmpty();
    }

    [Fact]
    public void Dangling_edge_is_reported()
    {
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "svc-a",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "a",
                    Category = GraphTopologyCategories.Compute,
                    SourceType = "Inventory",
                    SourceId = "svc-a",
                }
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "edge-1",
                    FromNodeId = "svc-a",
                    ToNodeId = "missing",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                }
            ],
            Warnings = [],
        };

        IReadOnlyList<GraphMergeInvariantViolation> violations = GraphMergeInvariantChecker.Check(graph);
        violations.Should().Contain(static v => v.Kind == GraphMergeInvariantKinds.DanglingEdge);
    }
}
