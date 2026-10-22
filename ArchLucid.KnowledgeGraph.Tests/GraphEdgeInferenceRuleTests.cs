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
    public void InferEdges_context_membership_rule_excludes_context_snapshot_node_when_node_type_differs_only_by_case()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        string contextNodeId = $"context-{snapshot.SnapshotId:N}";
        GraphNode contextNode = new()
        {
            NodeId = contextNodeId,
            NodeType = "contextsnapshot",
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
        edges.Should().NotContain(e => e.ToNodeId == contextNodeId && e.FromNodeId == contextNodeId);
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
    public void InferEdges_security_protection_rule_matches_when_protected_topology_list_has_surrounding_whitespace()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        GraphNode resource = new()
        {
            NodeId = "res-a",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "a",
        };
        GraphNode security = new()
        {
            NodeId = "sec-1",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "baseline",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds] = "  res-a  ",
            },
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(snapshot, [resource, security]);

        edges.Should().ContainSingle(e =>
            e.EdgeType == GraphEdgeTypes.Protects
            && e.FromNodeId == "sec-1"
            && e.ToNodeId == "res-a"
            && e.InferenceSource == GraphEdgeInferenceSources.SecurityTargeted);
    }

    [Fact]
    public void InferEdges_explicit_parent_child_rule_honors_parentNodeId_when_property_has_surrounding_whitespace()
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
                ["parentNodeId"] = " parent-1 ",
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
    public void InferEdges_topology_relationship_rule_resolves_depends_on_target_when_topology_node_id_has_surrounding_whitespace()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        GraphNode compute = new()
        {
            NodeId = "cmp-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "api",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.DependsOnNodeIds] = "ds-1",
            },
        };
        GraphNode data = new()
        {
            NodeId = "  ds-1  ",
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
    public void InferEdges_policy_applicability_rule_emits_trimmed_endpoints_when_topology_node_id_has_surrounding_whitespace()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        GraphNode resource = new()
        {
            NodeId = "  res-a  ",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "a",
        };
        GraphNode policy = new()
        {
            NodeId = "pol-1",
            NodeType = GraphNodeTypes.PolicyControl,
            Label = "policy",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.ApplicableTopologyNodeIds] = "res-a",
            },
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(snapshot, [resource, policy]);

        edges.Should().ContainSingle(e =>
            e.EdgeType == GraphEdgeTypes.AppliesTo
            && e.FromNodeId == "pol-1"
            && e.ToNodeId == "res-a"
            && e.InferenceSource == GraphEdgeInferenceSources.PolicyTargeted);
    }

    [Fact]
    public void InferEdges_requirement_relevance_rule_emits_trimmed_endpoints_when_topology_node_id_has_surrounding_whitespace()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        GraphNode resource = new()
        {
            NodeId = "  res-a  ",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "a",
        };
        GraphNode requirement = new()
        {
            NodeId = "req-1",
            NodeType = GraphNodeTypes.Requirement,
            Label = "req",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.RelatedTopologyNodeIds] = "res-a",
            },
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(snapshot, [resource, requirement]);

        edges.Should().ContainSingle(e =>
            e.EdgeType == GraphEdgeTypes.RelatesTo
            && e.FromNodeId == "req-1"
            && e.ToNodeId == "res-a"
            && e.InferenceSource == GraphEdgeInferenceSources.RequirementTargeted);
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
    public void InferEdges_topology_relationship_rule_resolves_connects_to_target_when_property_token_has_surrounding_whitespace()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        GraphNode source = new()
        {
            NodeId = "net-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "vnet",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["connectedToNodeIds"] = "  peer-1  ",
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

    [Fact]
    public void InferEdges_explicit_parent_child_rule_honors_parentNodeId_when_parent_node_id_has_surrounding_whitespace()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        GraphNode parent = new()
        {
            NodeId = "  parent-1  ",
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
    public void InferEdges_heuristic_network_subnet_rule_matches_parentNodeId_when_network_node_id_has_surrounding_whitespace()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        GraphNode networkEast = new()
        {
            NodeId = "  net-a  ",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "vnet-east",
            Category = GraphTopologyCategories.Network,
        };
        GraphNode networkWest = new()
        {
            NodeId = "net-b",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "vnet-west",
            Category = GraphTopologyCategories.Network,
        };
        GraphNode subnet = new()
        {
            NodeId = "subnet-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "subnet-vnet-east-tier",
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(snapshot, [networkEast, networkWest, subnet]);

        edges.Should().Contain(e =>
            e.InferenceSource == GraphEdgeInferenceSources.HeuristicNetworkSubnet
            && e.FromNodeId == "net-a"
            && e.ToNodeId == "subnet-1"
            && e.EdgeType == GraphEdgeTypes.ContainsResource);
        edges.Should().NotContain(e =>
            e.InferenceSource == GraphEdgeInferenceSources.HeuristicNetworkSubnet
            && e.FromNodeId == "net-b");
    }

    [Fact]
    public void InferEdges_heuristic_network_subnet_rule_includes_network_when_category_has_surrounding_whitespace()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        GraphNode network = new()
        {
            NodeId = "net-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "hub-vnet",
            Category = $"  {GraphTopologyCategories.Network}  ",
        };
        GraphNode subnet = new()
        {
            NodeId = "subnet-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "subnet-a",
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(snapshot, [network, subnet]);

        edges.Should().Contain(e =>
            e.InferenceSource == GraphEdgeInferenceSources.HeuristicNetworkSubnet
            && e.FromNodeId == "net-1"
            && e.ToNodeId == "subnet-1"
            && e.EdgeType == GraphEdgeTypes.ContainsResource);
    }

    [Fact]
    public void InferEdges_security_protection_rule_matches_topology_resource_when_node_type_has_surrounding_whitespace()
    {
        ContextSnapshot snapshot = BuildSnapshot();
        GraphNode resource = new()
        {
            NodeId = "res-a",
            NodeType = $"  {GraphNodeTypes.TopologyResource}  ",
            Label = "vm",
        };
        GraphNode security = new()
        {
            NodeId = "sec-1",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "baseline",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds] = "res-a",
            },
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(snapshot, [resource, security]);

        edges.Should().ContainSingle(e =>
            e.EdgeType == GraphEdgeTypes.Protects
            && e.FromNodeId == "sec-1"
            && e.ToNodeId == "res-a"
            && e.InferenceSource == GraphEdgeInferenceSources.SecurityTargeted);
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
