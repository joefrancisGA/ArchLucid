using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramPeeledSubnetVnetFrameCompileTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly DiagramForestLayoutSvgRenderer forestRenderer = new();
    private readonly DiagramAstGraphvizDotEmitter dotEmitter = new();

    [Fact]
    public void FullSubscription_compile_after_subnet_peel_places_two_vms_in_one_vnet_frame()
    {
        const string vnetArmId =
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/app";

        GraphNode vnet = TopologyNode("vnet", "Microsoft.Network/virtualNetworks", vnetArmId);
        GraphNode subnetA = TopologyNode(
            "subnet-a",
            "Microsoft.Network/virtualNetworks/subnets",
            $"{vnetArmId}/subnets/a");
        GraphNode subnetB = TopologyNode(
            "subnet-b",
            "Microsoft.Network/virtualNetworks/subnets",
            $"{vnetArmId}/subnets/b");
        GraphNode vmA = TopologyNode(
            "vm-a",
            "Microsoft.Compute/virtualMachines",
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Compute/virtualMachines/a");
        GraphNode vmB = TopologyNode(
            "vm-b",
            "Microsoft.Compute/virtualMachines",
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Compute/virtualMachines/b");

        GraphSnapshot filtered = PeelSubnetsFrom(new GraphSnapshot
        {
            Nodes = [vnet, subnetA, subnetB, vmA, vmB],
            Edges =
            [
                PlacementEdge("vm-a", "subnet-a"),
                PlacementEdge("vm-b", "subnet-b"),
            ],
        });

        DiagramAst ast = compiler.Compile(filtered, DiagramMode.FullSubscription);
        DiagramForestLayoutResult layout = forestRenderer.Render(ast);
        layout.Succeeded.Should().BeTrue(layout.Error);

        XDocument svg = XDocument.Parse(layout.Svg!);
        svg.Descendants().Count(element => element.Attribute("class")?.Value == "vnet-frame").Should().Be(1);
        svg.Descendants().Count(element => element.Attribute("class")?.Value == "subnet-frame").Should().Be(0);
    }

    [Fact]
    public void FullSubscription_compile_after_subnet_peel_draws_vnet_frame_without_subnet_cards()
    {
        GraphSnapshot filtered = PeelSubnetsFrom(BuildSameGroupVmSubnetGraph());
        DiagramAst ast = compiler.Compile(filtered, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node =>
            (node.ArmResourceType ?? string.Empty).Contains("/subnets", StringComparison.OrdinalIgnoreCase));
        ast.Edges.Should().Contain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryHiddenSubnetVnetPlacement);

        DiagramForestLayoutResult layout = forestRenderer.Render(ast);
        layout.Succeeded.Should().BeTrue(layout.Error);

        XDocument svg = XDocument.Parse(layout.Svg!);
        svg.Descendants().Count(element => element.Attribute("class")?.Value == "vnet-frame").Should().Be(1);
        svg.Descendants().Count(element => element.Attribute("class")?.Value == "subnet-frame").Should().Be(0);
        svg.Descendants().Any(element => element.Attribute("id")?.Value == "node-vnet").Should().BeFalse();

        string dot = dotEmitter.Emit(ast);
        InventoryDiagramExcellenceRatchetAssertions.AssertForestAndDotNestedFrameParity(layout.Svg!, dot);
    }

    private static GraphSnapshot PeelSubnetsFrom(GraphSnapshot graph)
    {
        return InventoryDiagramGraphPeelFilter.Filter(
            graph,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "Microsoft.Network/virtualNetworks/subnets",
            });
    }

    private static GraphSnapshot BuildSameGroupVmSubnetGraph()
    {
        const string vnetArmId =
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Network/virtualNetworks/app";
        const string subnetArmId = $"{vnetArmId}/subnets/app";

        GraphNode vnet = TopologyNode("vnet", "Microsoft.Network/virtualNetworks", vnetArmId);
        GraphNode subnet = TopologyNode("subnet", "Microsoft.Network/virtualNetworks/subnets", subnetArmId);
        GraphNode vm = TopologyNode(
            "vm",
            "Microsoft.Compute/virtualMachines",
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.Compute/virtualMachines/app");
        GraphNode vault = TopologyNode(
            "vault",
            "Microsoft.KeyVault/vaults",
            "/subscriptions/s/resourceGroups/rg-app/providers/Microsoft.KeyVault/vaults/app");

        return new GraphSnapshot
        {
            Nodes = [vnet, subnet, vm, vault],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "vm-subnet",
                    FromNodeId = vm.NodeId,
                    ToNodeId = subnet.NodeId,
                    EdgeType = AzureInventoryRelationshipAssociationTypes.NicToSubnet,
                    Weight = 1.0d,
                    InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
                },
            ],
        };
    }

    private static GraphEdge PlacementEdge(string fromNodeId, string toSubnetNodeId)
    {
        return new GraphEdge
        {
            EdgeId = $"{fromNodeId}-{toSubnetNodeId}",
            FromNodeId = fromNodeId,
            ToNodeId = toSubnetNodeId,
            EdgeType = AzureInventoryRelationshipAssociationTypes.NicToSubnet,
            Weight = 1.0d,
            InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
        };
    }

    private static GraphNode TopologyNode(string nodeId, string armType, string armId)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = nodeId,
            SourceId = armId,
            Properties =
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
                ["arm.resourceGroup"] = "rg-app",
            },
        };
    }
}
