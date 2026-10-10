using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramHiddenNsgShortcutLineAnnotationApplierTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_full_subscription_annotates_virtual_machine_to_virtual_network_line_with_tcp_443()
    {
        GraphSnapshot graph = BuildVmNsgSubnetVnetGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramEdge edge = FindVmToVnetEdge(ast);
        edge.DataFlowNsgAnnotationLabels.Should().Contain(label =>
            label.Contains("443", StringComparison.Ordinal)
            && label.Contains("TCP", StringComparison.OrdinalIgnoreCase));
        edge.Label.Should().Contain("443");
    }

    [Fact]
    public void Compile_with_network_details_does_not_annotate_shortcut_when_nsg_card_is_visible()
    {
        GraphSnapshot graph = BuildVmNsgSubnetVnetGraph();

        DiagramAst ast = compiler.Compile(
            graph,
            DiagramMode.FullSubscription,
            new DiagramAstCompileOptions { IncludeNetworkDetails = true });

        ast.Nodes.Should().Contain(node => node.Label == "nsg-app");
        DiagramEdge edge = FindVmToVnetEdge(ast);
        edge.DataFlowNsgAnnotationLabels.Should().BeEmpty();
    }

    [Fact]
    public void Compile_virtual_machine_without_nsg_has_no_protocol_annotation_on_line()
    {
        GraphSnapshot graph = BuildVmSubnetVnetGraphWithoutNsg();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramEdge edge = FindVmToVnetEdge(ast);
        edge.DataFlowNsgAnnotationLabels.Should().BeEmpty();
    }

    private static DiagramEdge FindVmToVnetEdge(DiagramAst ast)
    {
        string vmId = ast.Nodes.Single(node => node.Label == "vm-app").NodeId;
        string vnetId = ast.Nodes.Single(node => node.Label == "vnet-app").NodeId;

        return ast.Edges.Should().ContainSingle(edge =>
                !edge.IsLayoutOnly
                && ((edge.FromNodeId == vmId && edge.ToNodeId == vnetId)
                    || (edge.FromNodeId == vnetId && edge.ToNodeId == vmId)))
            .Subject;
    }

    private static GraphSnapshot BuildVmNsgSubnetVnetGraph()
    {
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app/subnets/subnet-app";
        const string nsgArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-app";

        GraphNode nsg = CreateNode("nsg", nsgArmId, "Microsoft.Network/networkSecurityGroups", "nsg-app");
        nsg.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationTargetSuffix}"] =
            subnetArmId;
        nsg.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationKindSuffix}"] =
            AzureInventoryNsgAssociationParser.SubnetKind;
        nsg.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleProtocolSuffix}"] =
            "TCP";
        nsg.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDestinationPortRangeSuffix}"] =
            "443";
        nsg.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDirectionSuffix}"] =
            "Inbound";
        nsg.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleAccessSuffix}"] =
            "Allow";
        nsg.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrioritySuffix}"] =
            "100";

        return BuildVmSubnetVnetGraph([nsg]);
    }

    private static GraphSnapshot BuildVmSubnetVnetGraphWithoutNsg()
    {
        return BuildVmSubnetVnetGraph([]);
    }

    private static GraphSnapshot BuildVmSubnetVnetGraph(IReadOnlyList<GraphNode> extraNodes)
    {
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-app";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app/subnets/subnet-app";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app";

        List<GraphNode> nodes =
        [
            CreateNode("vm", vmArmId, "Microsoft.Compute/virtualMachines", "vm-app"),
            CreateNode("nic", nicArmId, "Microsoft.Network/networkInterfaces", "nic-app"),
            CreateNode("subnet", subnetArmId, "Microsoft.Network/virtualNetworks/subnets", "subnet-app"),
            CreateNode("vnet", vnetArmId, "Microsoft.Network/virtualNetworks", "vnet-app"),
        ];
        nodes.AddRange(extraNodes);

        return new GraphSnapshot
        {
            Nodes = nodes,
            Edges =
            [
                CreateEdge("vm-nic", "vm", "nic", AzureInventoryRelationshipAssociationTypes.VmToNic, GraphEdgeInferenceSources.InventoryVmNic),
                CreateEdge("nic-subnet", "nic", "subnet", AzureInventoryRelationshipAssociationTypes.NicToSubnet, GraphEdgeInferenceSources.InventoryNicSubnet),
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
