using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class InventoryDiagramExternalTargetApplierTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_connected_peering_to_missing_vnet_draws_one_external_card()
    {
        GraphSnapshot graph = BuildVnetWithPeering("Connected", "/subscriptions/other/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/remote");

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().ContainSingle(node => node.Label == "Outside this subscription: remote");
        ast.Edges.Should().ContainSingle(edge =>
            !edge.IsLayoutOnly
            && edge.Label == InventoryDiagramRelationshipLabelTexts.Peered);
    }

    [Fact]
    public void Compile_two_peerings_to_same_missing_vnet_shares_one_external_card()
    {
        const string remoteArmId =
            "/subscriptions/other/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/remote";
        GraphNode firstVnet = CreateVnet("vnet-a", "vnet-a");
        GraphNode secondVnet = CreateVnet("vnet-b", "vnet-b");
        AddPeering(firstVnet, "Connected", remoteArmId);
        AddPeering(secondVnet, "Connected", remoteArmId);

        DiagramAst ast = compiler.Compile(
            new GraphSnapshot { Nodes = [firstVnet, secondVnet] },
            DiagramMode.FullSubscription);

        ast.Nodes.Should().ContainSingle(node => node.Label == "Outside this subscription: remote");
        ast.Edges.Count(edge =>
            !edge.IsLayoutOnly
            && edge.Label == InventoryDiagramRelationshipLabelTexts.Peered).Should().Be(2);
    }

    [Fact]
    public void Compile_disconnected_peering_to_missing_vnet_does_not_draw_external_card()
    {
        GraphSnapshot graph = BuildVnetWithPeering("Disconnected", "/subscriptions/other/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/remote");

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.Label.StartsWith("Outside this subscription:", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_private_endpoint_to_missing_service_draws_private_access_to_external_card()
    {
        const string serviceArmId =
            "/subscriptions/other/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/remote";
        GraphNode vnet = CreateVnet("vnet", "vnet-a");
        GraphNode subnet = CreateNode(
            "subnet",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a/subnets/subnet-a",
            "Microsoft.Network/virtualNetworks/subnets",
            "subnet-a");
        GraphNode privateEndpoint = CreateNode(
            "private-endpoint",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-a",
            "Microsoft.Network/privateEndpoints",
            "pe-a");
        privateEndpoint.Properties["privateLinkServiceConnections"] =
            $"[{{\"properties\":{{\"privateLinkServiceId\":\"{serviceArmId}\"}}}}]";

        DiagramAst ast = compiler.Compile(
            new GraphSnapshot
            {
                Nodes = [vnet, subnet, privateEndpoint],
                Edges =
                [
                    CreateEdge("pe-subnet", "private-endpoint", "subnet", AzureInventoryRelationshipAssociationTypes.PeToSubnet),
                    CreateEdge("subnet-vnet", "subnet", "vnet", GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement),
                ],
            },
            DiagramMode.FullSubscription);

        string externalNodeId = ast.Nodes.Single(node => node.Label == "Outside this subscription: remote").NodeId;
        string vnetNodeId = ast.Nodes.Single(node => node.Label == "vnet-a").NodeId;
        ast.Edges.Should().Contain(edge =>
            !edge.IsLayoutOnly
            && edge.FromNodeId == vnetNodeId
            && edge.ToNodeId == externalNodeId
            && edge.Label == InventoryDiagramRelationshipLabelTexts.PrivateAccess);
    }

    private static GraphSnapshot BuildVnetWithPeering(string state, string remoteArmId)
    {
        GraphNode vnet = CreateVnet("vnet-a-node", "vnet-a");
        AddPeering(vnet, state, remoteArmId);

        return new GraphSnapshot { Nodes = [vnet] };
    }

    private static void AddPeering(GraphNode vnet, string state, string remoteArmId)
    {
        vnet.Properties[AzureInventoryVnetPeeringParser.PeeringsPropertyKey] =
            $"[{{\"properties\":{{\"peeringState\":\"{state}\",\"remoteVirtualNetwork\":{{\"id\":\"{remoteArmId}\"}}}}}}]";
    }

    private static GraphNode CreateVnet(string nodeId, string label)
    {
        return CreateNode(
            nodeId,
            $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/{label}",
            "Microsoft.Network/virtualNetworks",
            label);
    }

    private static GraphNode CreateNode(string nodeId, string armId, string armType, string label)
    {
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
                ["arm.type"] = armType,
                ["arm.resourceGroup"] = "rg",
            },
        };
    }

    private static GraphEdge CreateEdge(string edgeId, string fromNodeId, string toNodeId, string edgeType)
    {
        return new GraphEdge
        {
            EdgeId = edgeId,
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = edgeType,
            Weight = 1.0d,
        };
    }
}
