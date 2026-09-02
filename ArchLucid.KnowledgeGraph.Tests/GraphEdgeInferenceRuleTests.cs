using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Category", "Unit")]
public sealed class GraphEdgeInferenceRuleTests
{
    private readonly DefaultGraphEdgeInferer _sut = new();

    [Fact]
    public void InferEdges_context_membership_rule_emits_contains_edges_for_non_context_nodes()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        string contextNodeId = $"context-{snapshot.SnapshotId:N}";
        GraphNode contextNode = new()
        {
            NodeId = contextNodeId,
            NodeType = GraphNodeTypes.ContextSnapshot,
            Label = "ctx",
        };
        GraphNode topology = new()
        {
            NodeId = "res-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "vnet",
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(snapshot, [contextNode, topology]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == contextNodeId
            && e.ToNodeId == "res-1"
            && e.EdgeType == GraphEdgeTypes.Contains
            && e.InferenceSource == GraphEdgeInferenceSources.ContextMembership);
    }

    [Fact]
    public void InferEdges_explicit_parent_child_rule_honors_parentNodeId_property()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        GraphNode parent = new()
        {
            NodeId = "parent-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "vnet",
        };
        GraphNode child = new()
        {
            NodeId = "child-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "subnet-a",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["parentNodeId"] = "parent-1",
            },
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(snapshot, [parent, child]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "parent-1"
            && e.ToNodeId == "child-1"
            && e.EdgeType == GraphEdgeTypes.ContainsResource
            && e.InferenceSource == GraphEdgeInferenceSources.ExplicitParentChild);
    }

    private static ContextSnapshot BuildSnapshot()
    {
        return new ContextSnapshot { SnapshotId = Guid.NewGuid(), RunId = Guid.NewGuid(), ProjectId = "proj-test" };
    }
}
