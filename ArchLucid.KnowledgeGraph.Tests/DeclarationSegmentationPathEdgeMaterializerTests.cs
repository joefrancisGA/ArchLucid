using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Materialization;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DeclarationSegmentationPathEdgeMaterializerTests
{
    [Fact]
    public void Materialize_emits_applies_to_and_connects_to_from_association()
    {
        GraphNode nsg = new()
        {
            NodeId = "obj-nsg",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "edge",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_network_security_group",
                ["tf.security_rule"] =
                    "access = allow direction = inbound source_address_prefix = * destination_port_range = 22",
            },
        };
        GraphNode subnet = new()
        {
            NodeId = "obj-subnet",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "app",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_subnet",
                ["category"] = GraphTopologyCategories.Network,
                ["connectedToNodeIds"] = "pay_sql",
            },
        };
        GraphNode sql = new()
        {
            NodeId = "obj-sql",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "pay_sql",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["category"] = GraphTopologyCategories.Data,
            },
        };
        GraphNode association = new()
        {
            NodeId = "obj-assoc",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "edge_app",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_subnet_network_security_group_association",
                ["declarationSegmentationControlId"] = "edge",
                ["declarationAssociatedNodeId"] = "app",
            },
        };

        IReadOnlyList<GraphEdge> edges = DeclarationSegmentationPathEdgeMaterializer.Materialize(
            [nsg, subnet, sql, association]);

        edges.Should().Contain(edge =>
            edge.FromNodeId == nsg.NodeId
            && edge.ToNodeId == subnet.NodeId
            && edge.EdgeType == GraphEdgeTypes.AppliesTo
            && edge.InferenceSource == GraphEdgeInferenceSources.DeclarationSegmentationPath);
        edges.Should().Contain(edge =>
            edge.FromNodeId == subnet.NodeId
            && edge.ToNodeId == sql.NodeId
            && edge.EdgeType == GraphEdgeTypes.ConnectsTo);

        GraphSnapshot graph = new()
        {
            Nodes = [nsg, subnet, sql, association],
            Edges = edges.ToList(),
        };

        SegmentationSemanticsPathAnalyzer.HasPathToSensitiveTarget(graph, nsg.NodeId, out GraphNode? target, out int hops)
            .Should()
            .BeTrue();
        target!.NodeId.Should().Be(sql.NodeId);
        hops.Should().BeGreaterThanOrEqualTo(2);
    }

    [Fact]
    public void Materialize_emits_no_edges_when_associated_subnet_missing()
    {
        GraphNode nsg = new()
        {
            NodeId = "obj-nsg",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "edge",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_network_security_group",
            },
        };
        GraphNode association = new()
        {
            NodeId = "obj-assoc",
            NodeType = GraphNodeTypes.SecurityBaseline,
            Label = "edge_app",
            Properties = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                ["terraformType"] = "azurerm_subnet_network_security_group_association",
                ["declarationSegmentationControlId"] = "edge",
                ["declarationAssociatedNodeId"] = "missing-subnet",
            },
        };

        DeclarationSegmentationPathEdgeMaterializer.Materialize([nsg, association]).Should().BeEmpty();
    }
}
