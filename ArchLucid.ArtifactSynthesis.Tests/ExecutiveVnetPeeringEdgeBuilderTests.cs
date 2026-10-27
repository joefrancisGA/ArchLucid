using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class ExecutiveVnetPeeringEdgeBuilderTests
{
    [Fact]
    public void Apply_relabels_blank_existing_virtual_network_pair_edges()
    {
        DiagramAst ast = CreateVirtualNetworkPairAst(label: string.Empty);
        GraphSnapshot graph = new();

        ExecutiveVnetPeeringEdgeBuilder.Apply(
            ast,
            graph,
            Array.Empty<GraphNode>(),
            new Dictionary<string, string>(StringComparer.Ordinal));

        DiagramEdge edge = ast.Edges.Single();
        edge.Label.Should().Be(InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored);
        edge.InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryVnetPeering);
        edge.ProvenanceKind.Should().Be("ObservedFact");
    }

    [Fact]
    public void Apply_leaves_stored_virtual_network_edge_labels_unchanged()
    {
        DiagramAst ast = CreateVirtualNetworkPairAst(label: "connects");
        GraphSnapshot graph = new();

        ExecutiveVnetPeeringEdgeBuilder.Apply(
            ast,
            graph,
            Array.Empty<GraphNode>(),
            new Dictionary<string, string>(StringComparer.Ordinal));

        ast.Edges.Single().Label.Should().Be("connects");
        ast.Edges.Single().ProvenanceKind.Should().BeNull();
    }

    [Fact]
    public void Apply_stamps_observed_fact_on_existing_peering_label_without_provenance()
    {
        DiagramAst ast = CreateVirtualNetworkPairAst(label: "peering");
        GraphSnapshot graph = new();

        ExecutiveVnetPeeringEdgeBuilder.Apply(
            ast,
            graph,
            Array.Empty<GraphNode>(),
            new Dictionary<string, string>(StringComparer.Ordinal));

        DiagramEdge peering = ast.Edges.Single();
        peering.Label.Should().Be(InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored);
        peering.InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryVnetPeering);
        peering.ProvenanceKind.Should().Be("ObservedFact");
    }

    [Fact]
    public void Apply_relabels_relationship_omission_virtual_network_pair_edges()
    {
        DiagramAst ast = CreateVirtualNetworkPairAst(label: DiagramConnectionTypeAnnotator.RelationshipNotStoredLabel);
        GraphSnapshot graph = new();

        ExecutiveVnetPeeringEdgeBuilder.Apply(
            ast,
            graph,
            Array.Empty<GraphNode>(),
            new Dictionary<string, string>(StringComparer.Ordinal));

        DiagramEdge edge = ast.Edges.Single();
        edge.Label.Should().Be(InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored);
        edge.InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryVnetPeering);
        edge.ProvenanceKind.Should().Be("ObservedFact");
    }

    [Fact]
    public void Apply_does_not_invent_peering_for_blank_non_virtual_network_edges()
    {
        DiagramAst ast = new()
        {
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "storage",
                    Label = "storage",
                    ArmResourceType = "Microsoft.Storage/storageAccounts",
                },
                new DiagramNode
                {
                    NodeId = "app",
                    Label = "app",
                    ArmResourceType = "Microsoft.Web/sites",
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "app",
                    ToNodeId = "storage",
                    Label = string.Empty,
                },
            ],
        };
        GraphSnapshot graph = new();

        ExecutiveVnetPeeringEdgeBuilder.Apply(
            ast,
            graph,
            Array.Empty<GraphNode>(),
            new Dictionary<string, string>(StringComparer.Ordinal));

        ast.Edges.Single().Label.Should().BeEmpty();
    }

    [Fact]
    public void Apply_synthesizes_missing_peering_edge_from_property_json()
    {
        const string vnetAArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
        const string vnetBArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-b";
        DiagramAst ast = CreateVirtualNetworkPairAst(label: "connects");
        ast.Edges.Clear();
        GraphNode left = CreateVnetGraphNode("graph-a", vnetAArmId);
        GraphNode right = CreateVnetGraphNode("graph-b", vnetBArmId);
        left.Properties[AzureInventoryVnetPeeringParser.PeeringsPropertyKey] =
            "[{\"properties\":{\"peeringState\":\"Connected\",\"remoteVirtualNetwork\":{\"id\":\"" + vnetBArmId + "\"}}}]";
        GraphSnapshot graph = new();
        graph.Nodes.Add(left);
        graph.Nodes.Add(right);

        ExecutiveVnetPeeringEdgeBuilder.Apply(
            ast,
            graph,
            [left, right],
            new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["graph-a"] = "vnet-a",
                ["graph-b"] = "vnet-b",
            });

        DiagramEdge peering = ast.Edges.Should().ContainSingle().Subject;
        peering.Label.Should().Be(InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored);
        peering.InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryVnetPeering);
        peering.ProvenanceKind.Should().Be("ObservedFact");
    }

    private static GraphNode CreateVnetGraphNode(string nodeId, string armId)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = "Microsoft.Network/virtualNetworks",
            },
        };
    }

    private static DiagramAst CreateVirtualNetworkPairAst(string label)
    {
        return new DiagramAst
        {
            Nodes =
            [
                new DiagramNode
                {
                    NodeId = "vnet-a",
                    Label = "vnet-a",
                    ArmResourceType = "Microsoft.Network/virtualNetworks",
                },
                new DiagramNode
                {
                    NodeId = "vnet-b",
                    Label = "vnet-b",
                    ArmResourceType = "Microsoft.Network/virtualNetworks",
                },
            ],
            Edges =
            [
                new DiagramEdge
                {
                    FromNodeId = "vnet-a",
                    ToNodeId = "vnet-b",
                    Label = label,
                },
            ],
        };
    }
}
