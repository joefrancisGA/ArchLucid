using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramNodeRelationshipApplierTests
{
    private const string GatewayAArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworkGateways/gw-a";

    private const string GatewayBArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworkGateways/gw-b";

    private const string WorkflowArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Logic/workflows/notify";

    private const string StorageArmId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/stnotify";

    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_resolved_network_connection_emits_one_edge_and_no_connection_node()
    {
        GraphSnapshot graph = BuildNetworkConnectionGraph(includeBothEndpoints: true);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.ArmResourceType == "Microsoft.Network/connections");
        ast.Edges.Should().ContainSingle(edge =>
            !edge.IsLayoutOnly
            && edge.Label.Contains("IPsec", StringComparison.Ordinal)
            && edge.Label.Contains("gw-a", StringComparison.Ordinal)
            && edge.Label.Contains("gw-b", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_unresolved_network_connection_keeps_node_and_emits_no_relationship_edge()
    {
        GraphSnapshot graph = BuildNetworkConnectionGraph(includeBothEndpoints: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().ContainSingle(node => node.ArmResourceType == "Microsoft.Network/connections");
        ast.Edges.Should().NotContain(edge =>
            !edge.IsLayoutOnly && edge.Label.Contains("IPsec", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_workflow_with_two_resolvable_actions_emits_two_edges()
    {
        GraphSnapshot graph = BuildWorkflowGraph(includeResolvableActions: true, actionCount: 2);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Edges.Count(edge =>
                !edge.IsLayoutOnly
                && edge.InferenceSource == GraphEdgeInferenceSources.InventoryWorkflowAction)
            .Should()
            .Be(2);
    }

    [Fact]
    public void Compile_workflow_without_resolvable_action_keeps_workflow_node()
    {
        GraphSnapshot graph = BuildWorkflowGraph(includeResolvableActions: false, actionCount: 0);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().ContainSingle(node => node.ArmResourceType == "Microsoft.Logic/workflows");
        ast.Edges.Should().NotContain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryWorkflowAction);
    }

    [Fact]
    public void Compile_configured_network_connection_labels_edge_configured()
    {
        GraphSnapshot graph = BuildNetworkConnectionGraph(
            includeBothEndpoints: true,
            evidenceCurrency: InventoryDiagramEvidenceCurrency.Configured);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Edges.Should().ContainSingle(edge =>
            !edge.IsLayoutOnly && edge.Label.StartsWith("Configured", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_resolved_route_table_route_emits_one_edge_and_no_route_table_node()
    {
        GraphSnapshot graph = BuildRouteTableGraph(includeResolvableNextHop: true);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.ArmResourceType == "Microsoft.Network/routeTables");
        ast.Edges.Should().ContainSingle(edge =>
            !edge.IsLayoutOnly
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryRouteTableRoute
            && edge.Label.Contains("10.1.0.0/24", StringComparison.Ordinal)
            && edge.Label.Contains("VirtualAppliance", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_unresolved_route_table_route_keeps_node_and_emits_no_relationship_edge()
    {
        GraphSnapshot graph = BuildRouteTableGraph(includeResolvableNextHop: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().ContainSingle(node => node.ArmResourceType == "Microsoft.Network/routeTables");
        ast.Edges.Should().NotContain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryRouteTableRoute);
    }

    [Fact]
    public void Compile_nsg_attached_to_subnet_emits_attachment_with_rule_fields()
    {
        GraphSnapshot graph = BuildNsgGraph(includeAssociation: true);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => node.ArmResourceType == "Microsoft.Network/networkSecurityGroups");
        ast.Edges.Should().ContainSingle(edge =>
            !edge.IsLayoutOnly
            && edge.InferenceSource == GraphEdgeInferenceSources.InventoryNsgPolicyAttachment
            && edge.Label.Contains("TCP", StringComparison.Ordinal)
            && edge.Label.Contains("443", StringComparison.Ordinal)
            && edge.Label.Contains("Inbound", StringComparison.Ordinal)
            && edge.Label.Contains("Allow", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_nsg_without_association_keeps_nsg_node()
    {
        GraphSnapshot graph = BuildNsgGraph(includeAssociation: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramNode nsg = ast.Nodes.Should().ContainSingle(node =>
            node.ArmResourceType == "Microsoft.Network/networkSecurityGroups").Subject;
        nsg.IsUnresolvedPolicyOutlineOnly.Should().BeTrue();
        ast.Edges.Should().NotContain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryNsgPolicyAttachment);
    }

    [Fact]
    public void Compile_unresolved_nsg_stays_in_mermaid_outline_but_not_forest_canvas()
    {
        GraphSnapshot graph = BuildNsgGraph(includeAssociation: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);
        string mermaid = new MermaidDiagramRenderer().Render(ast);

        mermaid.Should().Contain("al-outline-only=true");
        mermaid.Should().Contain("Microsoft.Network/networkSecurityGroups");

        DiagramForestLayoutResult forestLayout = new DiagramForestLayoutSvgRenderer().Render(ast);
        forestLayout.Succeeded.Should().BeTrue();
        forestLayout.Svg.Should().NotContain("networkSecurityGroups");
    }

    [Fact]
    public void Compile_data_flow_mode_excludes_route_table_policy_edges()
    {
        GraphSnapshot graph = BuildRouteTableGraph(includeResolvableNextHop: true);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.DataFlow);

        ast.Edges.Should().NotContain(edge =>
            edge.InferenceSource == GraphEdgeInferenceSources.InventoryRouteTableRoute);
    }

    private static GraphSnapshot BuildNetworkConnectionGraph(
        bool includeBothEndpoints,
        InventoryDiagramEvidenceCurrency evidenceCurrency = InventoryDiagramEvidenceCurrency.Current)
    {
        const string connectionArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/connections/vpn-conn";

        GraphNode gatewayA = CreateTopologyNode("gw-a-node", GatewayAArmId, "Microsoft.Network/virtualNetworkGateways");
        GraphNode gatewayB = CreateTopologyNode("gw-b-node", GatewayBArmId, "Microsoft.Network/virtualNetworkGateways");
        GraphNode connection = CreateTopologyNode(
            "connection-node",
            connectionArmId,
            "Microsoft.Network/connections");
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.EvidenceCurrency] = evidenceCurrency.ToString();
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionType] = "IPsec";
        connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint1ArmId] = GatewayAArmId;

        if (includeBothEndpoints)
        {
            connection.Properties[InventoryDiagramNodeRelationshipPropertyKeys.ConnectionEndpoint2ArmId] = GatewayBArmId;
        }

        List<GraphNode> nodes = includeBothEndpoints
            ? [gatewayA, gatewayB, connection]
            : [gatewayA, connection];

        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes,
            Edges = [],
        };
    }

    private static GraphSnapshot BuildWorkflowGraph(bool includeResolvableActions, int actionCount)
    {
        GraphNode workflow = CreateTopologyNode("workflow-node", WorkflowArmId, "Microsoft.Logic/workflows");
        List<GraphNode> nodes = [workflow];

        if (includeResolvableActions)
        {
            for (int index = 0; index < actionCount; index++)
            {
                string storageName = index == 0 ? "stnotify" : $"stnotify{index}";
                string storageArmId =
                    $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/{storageName}";
                nodes.Add(CreateTopologyNode($"storage-node-{index}", storageArmId, "Microsoft.Storage/storageAccounts"));
                workflow.Properties[
                        $"{InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionPrefix}Action{index}{InventoryDiagramNodeRelationshipPropertyKeys.WorkflowActionTargetSuffix}"] =
                    storageArmId;
            }
        }

        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes,
            Edges = [],
        };
    }

    private static GraphSnapshot BuildRouteTableGraph(bool includeResolvableNextHop)
    {
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/app";
        const string routeTableArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/routeTables/rt-app";
        const string firewallArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw-app";

        GraphNode subnet = CreateTopologyNode(
            "subnet-node",
            subnetArmId,
            "Microsoft.Network/virtualNetworks/subnets");
        GraphNode routeTable = CreateTopologyNode(
            "route-table-node",
            routeTableArmId,
            "Microsoft.Network/routeTables");
        routeTable.Properties[$"{InventoryDiagramNodeRelationshipPropertyKeys.RouteTableSubnetPrefix}0"] = subnetArmId;
        routeTable.Properties[
                $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.RouteAddressPrefixSuffix}"] =
            "10.1.0.0/24";
        routeTable.Properties[
                $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopTypeSuffix}"] =
            "VirtualAppliance";
        routeTable.Properties[
                $"{InventoryDiagramNodeRelationshipPropertyKeys.RoutePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.RouteNextHopIpAddressSuffix}"] =
            includeResolvableNextHop ? "10.0.0.4" : "10.0.0.99";

        List<GraphNode> nodes = [subnet, routeTable];

        if (includeResolvableNextHop)
        {
            GraphNode firewall = CreateTopologyNode(
                "firewall-node",
                firewallArmId,
                "Microsoft.Network/azureFirewalls");
            firewall.Properties["ipConfigurations"] =
                """[{"properties":{"privateIPAddress":"10.0.0.4"}}]""";
            nodes.Add(firewall);
        }

        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = nodes,
            Edges = [],
        };
    }

    private static GraphSnapshot BuildNsgGraph(bool includeAssociation)
    {
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/app";
        const string nsgArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/nsg-app";

        GraphNode subnet = CreateTopologyNode(
            "subnet-node",
            subnetArmId,
            "Microsoft.Network/virtualNetworks/subnets");
        GraphNode nsg = CreateTopologyNode(
            "nsg-node",
            nsgArmId,
            "Microsoft.Network/networkSecurityGroups");
        nsg.Properties[
                $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleProtocolSuffix}"] =
            "TCP";
        nsg.Properties[
                $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDestinationPortRangeSuffix}"] =
            "443";
        nsg.Properties[
                $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleDirectionSuffix}"] =
            "Inbound";
        nsg.Properties[
                $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgRulePrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgRuleAccessSuffix}"] =
            "Allow";

        if (includeAssociation)
        {
            nsg.Properties[
                    $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationTargetSuffix}"] =
                subnetArmId;
            nsg.Properties[
                    $"{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationPrefix}0{InventoryDiagramNodeRelationshipPropertyKeys.NsgAssociationKindSuffix}"] =
                AzureInventoryNsgAssociationParser.SubnetKind;
        }

        return new GraphSnapshot
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.Empty,
            CreatedUtc = DateTime.UtcNow,
            Nodes = [subnet, nsg],
            Edges = [],
        };
    }

    private static GraphNode CreateTopologyNode(string nodeId, string armId, string armType)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = MermaidIdSanitizer.Sanitize(armId),
            Category = "network",
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
}
