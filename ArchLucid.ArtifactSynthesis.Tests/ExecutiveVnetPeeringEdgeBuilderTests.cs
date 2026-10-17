using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

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

        ast.Edges.Single().Label.Should().Be("peering");
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
