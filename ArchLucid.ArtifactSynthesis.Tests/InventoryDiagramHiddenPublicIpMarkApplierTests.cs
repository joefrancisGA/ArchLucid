using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class InventoryDiagramHiddenPublicIpMarkApplierTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_full_subscription_marks_virtual_machine_public_when_public_ip_is_hidden()
    {
        GraphSnapshot graph = BuildVmPublicIpVnetGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.Label == "pip-app");
        DiagramNode vm = ast.Nodes.Single(node => node.Label == "vm-app");
        vm.HasPublicInternetExposure.Should().BeTrue();
        DiagramNodeHumanCaptionFactory.Create(vm).CombinedPlainText.Should().Contain("public");
    }

    [Fact]
    public void Compile_with_network_details_does_not_mark_virtual_machine_public_when_public_ip_card_is_visible()
    {
        GraphSnapshot graph = BuildVmPublicIpVnetGraph();

        DiagramAst ast = compiler.Compile(
            graph,
            DiagramMode.FullSubscription,
            new DiagramAstCompileOptions { IncludeNetworkDetails = true });

        ast.Nodes.Should().Contain(node => node.Label == "pip-app");
        DiagramNode vm = ast.Nodes.Single(node => node.Label == "vm-app");
        vm.HasPublicInternetExposure.Should().BeFalse();
        DiagramNodeHumanCaptionFactory.Create(vm).CombinedPlainText.Should().NotContain(" · public");
    }

    [Fact]
    public void Compile_unattached_public_ip_does_not_mark_virtual_machine_public()
    {
        GraphSnapshot graph = BuildUnattachedPublicIpGraph();

        DiagramAst ast = compiler.Compile(
            graph,
            DiagramMode.FullSubscription,
            new DiagramAstCompileOptions { OrphanAnalysisGraph = graph });

        ast.Nodes.Should().NotContain(node => node.Label == "pip-orphan");
        ast.Nodes.Should().NotContain(node => node.HasPublicInternetExposure);
    }

    private static GraphSnapshot BuildVmPublicIpVnetGraph()
    {
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-app";
        const string pipArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-app";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app/subnets/subnet-app";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app";

        return new GraphSnapshot
        {
            Nodes =
            [
                CreateNode("vm", vmArmId, "Microsoft.Compute/virtualMachines", "vm-app"),
                CreateNode("nic", nicArmId, "Microsoft.Network/networkInterfaces", "nic-app"),
                CreateNode("pip", pipArmId, "Microsoft.Network/publicIPAddresses", "pip-app"),
                CreateNode("subnet", subnetArmId, "Microsoft.Network/virtualNetworks/subnets", "subnet-app"),
                CreateNode("vnet", vnetArmId, "Microsoft.Network/virtualNetworks", "vnet-app"),
            ],
            Edges =
            [
                CreateEdge("vm-nic", "vm", "nic", AzureInventoryRelationshipAssociationTypes.VmToNic, GraphEdgeInferenceSources.InventoryVmNic),
                CreateEdge("nic-subnet", "nic", "subnet", AzureInventoryRelationshipAssociationTypes.NicToSubnet, GraphEdgeInferenceSources.InventoryNicSubnet),
                CreateEdge("pip-nic", "pip", "nic", GraphEdgeTypes.Exposes, GraphEdgeInferenceSources.InventoryPublicIp),
            ],
        };
    }

    private static GraphSnapshot BuildUnattachedPublicIpGraph()
    {
        const string pipArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip-orphan";
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";

        return new GraphSnapshot
        {
            Nodes =
            [
                CreateNode("pip", pipArmId, "Microsoft.Network/publicIPAddresses", "pip-orphan"),
                CreateNode("vm", vmArmId, "Microsoft.Compute/virtualMachines", "vm-app"),
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
