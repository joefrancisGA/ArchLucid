using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DiagramHiddenPrivateEndpointConnectorTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_full_subscription_draws_private_access_line_outside_virtual_network()
    {
        GraphSnapshot graph = BuildPrivateEndpointKeyVaultGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.Label == "pe-kv");
        ast.Edges.Should().ContainSingle(edge =>
            edge.Label == InventoryDiagramRelationshipLabelTexts.PrivateAccess
            && ast.Nodes.Any(node => node.NodeId == edge.FromNodeId && node.Label == "kv-app")
            && ast.Nodes.Any(node => node.NodeId == edge.ToNodeId && node.Label == "vnet-app"));
    }

    [Fact]
    public void Compile_with_network_details_removes_private_access_shortcut()
    {
        GraphSnapshot graph = BuildPrivateEndpointKeyVaultGraph();

        DiagramAst ast = compiler.Compile(
            graph,
            DiagramMode.FullSubscription,
            new DiagramAstCompileOptions { IncludeNetworkDetails = true });

        ast.Nodes.Should().Contain(node => node.Label == "pe-kv");
        ast.Edges.Should().NotContain(edge => edge.Label == InventoryDiagramRelationshipLabelTexts.PrivateAccess);
    }

    private static GraphSnapshot BuildPrivateEndpointKeyVaultGraph()
    {
        const string kvArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.KeyVault/vaults/kv-app";
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-kv";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app/subnets/data";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app";

        return new GraphSnapshot
        {
            Nodes =
            [
                CreateNode("kv", kvArmId, "Microsoft.KeyVault/vaults", "kv-app"),
                CreateNode("pe", peArmId, "Microsoft.Network/privateEndpoints", "pe-kv"),
                CreateNode("subnet", subnetArmId, "Microsoft.Network/virtualNetworks/subnets", "data"),
                CreateNode("vnet", vnetArmId, "Microsoft.Network/virtualNetworks", "vnet-app"),
            ],
            Edges =
            [
                CreateEdge("pe-subnet", "pe", "subnet", AzureInventoryRelationshipAssociationTypes.PeToSubnet, GraphEdgeInferenceSources.InventoryPeSubnet),
                CreateEdge("pe-kv", "pe", "kv", AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
            ],
        };
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

    private static GraphEdge CreateEdge(
        string edgeId,
        string fromNodeId,
        string toNodeId,
        string edgeType,
        string inferenceSource)
    {
        return new GraphEdge
        {
            EdgeId = edgeId,
            FromNodeId = fromNodeId,
            ToNodeId = toNodeId,
            EdgeType = edgeType,
            Label = edgeType,
            InferenceSource = inferenceSource,
            Weight = 1.0d,
        };
    }
}
