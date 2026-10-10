using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramVnetPeeringRelationshipApplierTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_connected_peering_draws_one_peered_line()
    {
        GraphSnapshot graph = BuildPeeringGraph("Connected");

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        CountPeeredLines(ast).Should().Be(1);
    }

    [Fact]
    public void Compile_reciprocal_peering_records_still_draw_one_line()
    {
        GraphSnapshot graph = BuildReciprocalPeeringGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        CountPeeredLines(ast).Should().Be(1);
    }

    [Fact]
    public void Compile_disconnected_peering_is_outline_only()
    {
        GraphSnapshot graph = BuildPeeringGraph("Disconnected");

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        CountPeeredLines(ast).Should().Be(0);
        DiagramNode vnetA = ast.Nodes.Single(node => node.Label == "vnet-a");
        vnetA.UnresolvedRelationshipDetails.Should().Contain("Peering to vnet-b is not connected");
    }

    [Fact]
    public void Compile_initiated_peering_is_outline_only()
    {
        GraphSnapshot graph = BuildPeeringGraph("Initiated");

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        CountPeeredLines(ast).Should().Be(0);
        DiagramNode vnetA = ast.Nodes.Single(node => node.Label == "vnet-a");
        vnetA.UnresolvedRelationshipDetails.Should().Contain("Peering to vnet-b is not connected");
    }

    [Fact]
    public void Compile_disconnected_peering_without_remote_name_uses_omission_copy()
    {
        GraphNode vnetA = CreateVnet("vnet-a-node", "vnet-a");
        vnetA.Properties[AzureInventoryVnetPeeringParser.PeeringsPropertyKey] =
            "[{\"properties\":{\"peeringState\":\"Disconnected\",\"remoteVirtualNetwork\":{\"id\":\"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/\"}}}]";

        DiagramAst ast = compiler.Compile(
            new GraphSnapshot { Nodes = [vnetA] },
            DiagramMode.FullSubscription);

        ast.Nodes.Single(node => node.Label == "vnet-a").UnresolvedRelationshipDetails.Should()
            .Contain("Peering to Remote network name was not stored. is not connected");
    }

    [Fact]
    public void Compile_shared_resource_group_without_peering_draws_no_line()
    {
        GraphSnapshot graph = new()
        {
            Nodes =
            [
                CreateVnet("vnet-a-node", "vnet-a"),
                CreateVnet("vnet-b-node", "vnet-b"),
            ],
        };

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        CountPeeredLines(ast).Should().Be(0);
    }

    private static int CountPeeredLines(DiagramAst ast)
    {
        return ast.Edges.Count(edge =>
            !edge.IsLayoutOnly
            && string.Equals(edge.Label, InventoryDiagramRelationshipLabelTexts.Peered, StringComparison.Ordinal));
    }

    private static GraphSnapshot BuildPeeringGraph(string peeringState)
    {
        GraphNode vnetA = CreateVnet("vnet-a-node", "vnet-a");
        GraphNode vnetB = CreateVnet("vnet-b-node", "vnet-b");
        string vnetBArmId = vnetB.Properties["arm.id"];
        vnetA.Properties[AzureInventoryVnetPeeringParser.PeeringsPropertyKey] =
            $"[{{\"properties\":{{\"peeringState\":\"{peeringState}\",\"remoteVirtualNetwork\":{{\"id\":\"{vnetBArmId}\"}}}}}}]";

        return new GraphSnapshot
        {
            Nodes = [vnetA, vnetB],
        };
    }

    private static GraphSnapshot BuildReciprocalPeeringGraph()
    {
        GraphNode vnetA = CreateVnet("vnet-a-node", "vnet-a");
        GraphNode vnetB = CreateVnet("vnet-b-node", "vnet-b");
        string vnetAArmId = vnetA.Properties["arm.id"];
        string vnetBArmId = vnetB.Properties["arm.id"];
        vnetA.Properties[AzureInventoryVnetPeeringParser.PeeringsPropertyKey] =
            $"[{{\"properties\":{{\"peeringState\":\"Connected\",\"remoteVirtualNetwork\":{{\"id\":\"{vnetBArmId}\"}}}}}}]";
        vnetB.Properties[AzureInventoryVnetPeeringParser.PeeringsPropertyKey] =
            $"[{{\"properties\":{{\"peeringState\":\"Connected\",\"remoteVirtualNetwork\":{{\"id\":\"{vnetAArmId}\"}}}}}}]";

        return new GraphSnapshot
        {
            Nodes = [vnetA, vnetB],
        };
    }

    private static GraphNode CreateVnet(string nodeId, string label)
    {
        string armId =
            $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/{label}";

        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = "Microsoft.Network/virtualNetworks",
                ["arm.resourceGroup"] = "rg",
            },
        };
    }
}
