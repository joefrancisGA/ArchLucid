using ArchLucid.ContextIngestion.Models;
using ArchLucid.KnowledgeGraph.Inference;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

/// <summary>
///     Unit tests for <see cref="DefaultGraphEdgeInferer" /> edge inference rules (canonical object graphs from context
///     snapshots).
/// </summary>
[Trait("Category", "Unit")]
public sealed class DefaultGraphEdgeInfererContractTests
{
    private readonly DefaultGraphEdgeInferer _sut = new();

    [Fact]
    public void InferEdges_WhenChildDeclaresParentNodeId_AddsContainsResourceFromParentToChild()
    {
        ContextSnapshot context = new() { SnapshotId = Guid.NewGuid() };
        GraphNode parent = new()
        {
            NodeId = "topo-parent",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "parent",
            Category = GraphTopologyCategories.Storage
        };
        GraphNode child = new()
        {
            NodeId = "topo-child",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "child",
            Category = GraphTopologyCategories.Storage,
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["parentNodeId"] = "topo-parent"
            }
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(context, [parent, child]);

        GraphEdge? edge = edges.SingleOrDefault(e => e is
            { EdgeType: GraphEdgeTypes.ContainsResource, FromNodeId: "topo-parent", ToNodeId: "topo-child" });

        edge.Should().NotBeNull();
        edge.Weight.Should().Be(1d);
    }

    [Fact]
    public void InferEdges_WhenPolicyListsApplicableTopologyNodeIds_OnlyTargetsListedResources()
    {
        ContextSnapshot context = new() { SnapshotId = Guid.NewGuid() };
        GraphNode topoA = new()
        {
            NodeId = "res-a",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "a",
            Category = GraphTopologyCategories.Compute
        };
        GraphNode topoB = new()
        {
            NodeId = "res-b",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "b",
            Category = GraphTopologyCategories.Compute
        };
        GraphNode policy = new()
        {
            NodeId = "pol-1",
            NodeType = GraphNodeTypes.PolicyControl,
            Label = "policy",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.ApplicableTopologyNodeIds] = "res-a"
            }
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(context, [topoA, topoB, policy]);

        edges.Should()
            .ContainSingle(e =>
                e.EdgeType == GraphEdgeTypes.AppliesTo &&
                e.FromNodeId == "pol-1" &&
                e.ToNodeId == "res-a")
            .Which.Weight.Should()
            .BeApproximately(1.0, 1e-10);
        edges.Should().NotContain(e => e.FromNodeId == "pol-1" && e.ToNodeId == "res-b");
    }

    [Fact]
    public void InferEdges_WhenSecurityListsProtectedTopologyNodeIds_OnlyTargetsListedResources()
    {
        ContextSnapshot context = new() { SnapshotId = Guid.NewGuid() };
        GraphNode topoA = new()
        {
            NodeId = "res-a",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "a",
            Category = GraphTopologyCategories.Compute
        };
        GraphNode topoB = new()
        {
            NodeId = "res-b",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "b",
            Category = GraphTopologyCategories.Compute
        };
        GraphNode security = new()
        {
            NodeId = "sec-1",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "baseline",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                [CanonicalGraphPropertyKeys.ProtectedTopologyNodeIds] = "res-a"
            }
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(context, [topoA, topoB, security]);

        edges.Should()
            .ContainSingle(e =>
                e.EdgeType == GraphEdgeTypes.Protects &&
                e.FromNodeId == "sec-1" &&
                e.ToNodeId == "res-a")
            .Which.Weight.Should()
            .BeApproximately(1.0, 1e-10);
        edges.Should().NotContain(e => e.FromNodeId == "sec-1" && e.ToNodeId == "res-b");
    }

    [Fact]
    public void InferEdges_Deduplicate_KeepsEdgeWithHighestWeight()
    {
        ContextSnapshot context = new() { SnapshotId = Guid.NewGuid() };
        GraphNode network = new()
        {
            NodeId = "net-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "vnet-prod",
            Category = GraphTopologyCategories.Network
        };
        GraphNode subnet = new()
        {
            NodeId = "sub-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "vnet-prod-subnet",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["parentNodeId"] = "net-1"
            }
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(context, [network, subnet]);

        edges.Should()
            .ContainSingle(e => e.EdgeType == GraphEdgeTypes.ContainsResource && e.FromNodeId == "net-1" && e.ToNodeId == "sub-1")
            .Which.Weight.Should().Be(1d);
    }

    [Fact]
    public void InferEdges_CircularDependencyInParentNodeIds_DoesNotInfiniteLoopAndAddsBothEdges()
    {
        ContextSnapshot context = new() { SnapshotId = Guid.NewGuid() };
        GraphNode nodeA = new()
        {
            NodeId = "node-a",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "A",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["parentNodeId"] = "node-b" }
        };
        GraphNode nodeB = new()
        {
            NodeId = "node-b",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "B",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["parentNodeId"] = "node-a" }
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(context, [nodeA, nodeB]);

        edges.Should().Contain(e => e.EdgeType == GraphEdgeTypes.ContainsResource && e.FromNodeId == "node-b" && e.ToNodeId == "node-a");
        edges.Should().Contain(e => e.EdgeType == GraphEdgeTypes.ContainsResource && e.FromNodeId == "node-a" && e.ToNodeId == "node-b");
    }

    [Theory]
    [InlineData("storage isolation", GraphTopologyCategories.Storage)]
    [InlineData("compute requires auth", GraphTopologyCategories.Compute)]
    [InlineData("database encryption", GraphTopologyCategories.Data)]
    public void InferEdges_RequirementRelevance_HeuristicsMatchCategoryCorrectly(string requirementText, string category)
    {
        ContextSnapshot context = new() { SnapshotId = Guid.NewGuid() };
        GraphNode requirement = new()
        {
            NodeId = "req-1",
            NodeType = GraphNodeTypes.Requirement,
            Label = "req",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) { ["text"] = requirementText }
        };
        GraphNode resource = new()
        {
            NodeId = "res-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "resource",
            Category = category
        };

        IReadOnlyList<GraphEdge> edges = _sut.InferEdges(context, [requirement, resource]);

        edges.Should().Contain(e => e.EdgeType == GraphEdgeTypes.RelatesTo && e.FromNodeId == "req-1" && e.ToNodeId == "res-1");
    }
}
