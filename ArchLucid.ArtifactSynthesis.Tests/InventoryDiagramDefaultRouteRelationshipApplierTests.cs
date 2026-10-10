using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramDefaultRouteRelationshipApplierTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_default_route_draws_routed_through_firewall_line()
    {
        GraphSnapshot graph = BuildDefaultRouteToFirewallGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        RequireVmToFirewallEdge(ast).Label.Should().Be("Routed through fw-app");
    }

    [Fact]
    public void Compile_specific_route_is_outline_only()
    {
        GraphSnapshot graph = BuildSpecificRouteToFirewallGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        AssertNoVmToFirewallEdge(ast);
        DiagramNode vm = ast.Nodes.Single(node => node.Label == "vm-app");
        vm.UnresolvedRelationshipDetails.Should().Contain("Traffic to 10.20.0.0/16 goes through fw-app");
    }

    [Fact]
    public void Compile_internet_next_hop_is_outline_only()
    {
        GraphSnapshot graph = BuildRouteGraph("Internet", null);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode vm = ast.Nodes.Single(node => node.Label == "vm-app");
        vm.UnresolvedRelationshipDetails.Should().Contain("Outbound internet is sent directly");
    }

    [Fact]
    public void Compile_none_next_hop_is_outline_only()
    {
        GraphSnapshot graph = BuildRouteGraph("None", null, "10.30.0.0/16");

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode vm = ast.Nodes.Single(node => node.Label == "vm-app");
        vm.UnresolvedRelationshipDetails.Should().Contain("Traffic to 10.30.0.0/16 is dropped");
    }

    [Fact]
    public void Compile_unknown_next_hop_keeps_does_not_resolve_outline()
    {
        GraphSnapshot graph = BuildRouteGraph("VirtualAppliance", "10.250.0.4", "10.250.0.0/16");

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode vm = ast.Nodes.Single(node => node.Label == "vm-app");
        vm.UnresolvedRelationshipDetails.Should().Contain("route next hop does not resolve");
    }

    [Fact]
    public void Compile_does_not_surface_route_table_name_on_lines()
    {
        GraphSnapshot graph = BuildDefaultRouteToFirewallGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Edges.Should().NotContain(edge => edge.Label != null && edge.Label.Contains("rt-app", StringComparison.Ordinal));
        ast.Nodes.Should().NotContain(node => node.Label == "rt-app");
    }

    private static DiagramEdge RequireVmToFirewallEdge(DiagramAst ast)
    {
        string vmId = ast.Nodes.Single(node => node.Label == "vm-app").NodeId;
        string fwId = ast.Nodes.Single(node => node.Label == "fw-app").NodeId;

        return ast.Edges.Should().ContainSingle(candidate =>
                !candidate.IsLayoutOnly
                && candidate.FromNodeId == vmId
                && candidate.ToNodeId == fwId)
            .Subject;
    }

    private static void AssertNoVmToFirewallEdge(DiagramAst ast)
    {
        string vmId = ast.Nodes.Single(node => node.Label == "vm-app").NodeId;
        string fwId = ast.Nodes.Single(node => node.Label == "fw-app").NodeId;
        ast.Edges.Should().NotContain(candidate =>
            !candidate.IsLayoutOnly
            && candidate.FromNodeId == vmId
            && candidate.ToNodeId == fwId);
    }

    private static GraphSnapshot BuildDefaultRouteToFirewallGraph()
    {
        return BuildRouteGraph("VirtualAppliance", null, "0.0.0.0/0", includeFirewall: true);
    }

    private static GraphSnapshot BuildSpecificRouteToFirewallGraph()
    {
        return BuildRouteGraph("VirtualAppliance", null, "10.20.0.0/16", includeFirewall: true);
    }

    private static GraphSnapshot BuildRouteGraph(
        string nextHopType,
        string? nextHopIp,
        string addressPrefix = "0.0.0.0/0",
        bool includeFirewall = false)
    {
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic-app";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app/subnets/subnet-app";
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app";
        const string routeTableArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/routeTables/rt-app";
        const string firewallArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw-app";

        GraphNode routeTable = CreateNode("rt", routeTableArmId, "Microsoft.Network/routeTables", "rt-app");
        routeTable.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.RouteTableSubnetPrefix}0"] = subnetArmId;
        routeTable.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] =
            addressPrefix;
        routeTable.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] =
            nextHopType;

        if (!string.IsNullOrWhiteSpace(nextHopIp))
        {
            routeTable.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] =
                nextHopIp;
        }

        List<GraphNode> nodes =
        [
            CreateNode("vm", vmArmId, "Microsoft.Compute/virtualMachines", "vm-app"),
            CreateNode("nic", nicArmId, "Microsoft.Network/networkInterfaces", "nic-app"),
            CreateNode("subnet", subnetArmId, "Microsoft.Network/virtualNetworks/subnets", "subnet-app"),
            CreateNode("vnet", vnetArmId, "Microsoft.Network/virtualNetworks", "vnet-app"),
            routeTable,
        ];

        if (includeFirewall)
        {
            GraphNode firewall = CreateNode("fw", firewallArmId, "Microsoft.Network/azureFirewalls", "fw-app");
            firewall.Properties["ipConfigurations"] =
                "[{\"properties\":{\"privateIPAddress\":\"10.0.0.4\"}}]";
            nodes.Add(firewall);
            routeTable.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] =
                "10.0.0.4";
        }

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
