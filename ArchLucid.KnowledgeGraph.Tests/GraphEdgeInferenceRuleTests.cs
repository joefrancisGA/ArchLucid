using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Models;
using ArchLucid.KnowledgeGraph;

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

    [Fact]
    public void InferEdges_explicit_parent_child_rule_uses_canonical_parent_node_id_when_property_value_differs_only_by_case()
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
                ["parentNodeId"] = "PARENT-1",
            },
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(snapshot, [parent, child]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "parent-1"
            && e.ToNodeId == "child-1"
            && e.EdgeType == GraphEdgeTypes.ContainsResource
            && e.InferenceSource == GraphEdgeInferenceSources.ExplicitParentChild);
    }

    [Fact]
    public void InferEdges_topology_relationship_rule_uses_canonical_target_node_id_when_depends_on_property_differs_only_by_case()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        GraphNode compute = new()
        {
            NodeId = "cmp-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "api",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.DependsOnNodeIds] = "DS-1",
            },
        };
        GraphNode data = new()
        {
            NodeId = "ds-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "sql",
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(snapshot, [compute, data]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "cmp-1"
            && e.ToNodeId == "ds-1"
            && e.EdgeType == GraphEdgeTypes.DependsOn
            && e.InferenceSource == GraphEdgeInferenceSources.TopologyDependsOn);
    }

    [Fact]
    public void InferEdges_topology_relationship_rule_uses_canonical_target_node_id_when_connected_to_property_differs_only_by_case()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        GraphNode source = new()
        {
            NodeId = "net-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "vnet",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["connectedToNodeIds"] = "PEER-1",
            },
        };
        GraphNode peer = new()
        {
            NodeId = "peer-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "peer-vnet",
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(snapshot, [source, peer]);

        edges.Should().ContainSingle(e =>
            e.FromNodeId == "net-1"
            && e.ToNodeId == "peer-1"
            && e.EdgeType == GraphEdgeTypes.ConnectsTo
            && e.InferenceSource == GraphEdgeInferenceSources.TopologyConnectsTo);
    }

    private static ContextSnapshot BuildSnapshot()
    {
        return new ContextSnapshot { SnapshotId = Guid.NewGuid(), RunId = Guid.NewGuid(), ProjectId = "proj-test" };
    }
}
