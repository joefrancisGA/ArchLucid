using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramCollapsedAttachmentEdgeLifterTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Compile_full_subscription_hides_nic_and_draws_virtual_machine_in_subnet()
    {
        GraphSnapshot graph = BuildVmNicSubnetGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node =>
            string.Equals(node.ArmResourceType, "Microsoft.Network/networkInterfaces", StringComparison.OrdinalIgnoreCase));
        ast.Nodes.Should().Contain(node => string.Equals(node.Label, "vm-app", StringComparison.Ordinal));
        ast.Nodes.Should().Contain(node => string.Equals(node.Label, "app", StringComparison.Ordinal));

        DiagramEdge? inSubnet = DiagramEdgeVisibility.VisibleEdges(ast.Edges)
            .SingleOrDefault(edge => string.Equals(edge.Label, "in", StringComparison.OrdinalIgnoreCase));
        inSubnet.Should().NotBeNull();
        ast.Nodes.Should().Contain(node =>
            node.NodeId == inSubnet!.FromNodeId && string.Equals(node.Label, "vm-app", StringComparison.Ordinal));
        ast.Nodes.Should().Contain(node =>
            node.NodeId == inSubnet!.ToNodeId && string.Equals(node.Label, "app", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_full_subscription_hides_private_endpoint_and_places_target_in_subnet()
    {
        GraphSnapshot graph = BuildPrivateEndpointSqlSubnetGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node => string.Equals(node.Label, "pe-sql", StringComparison.Ordinal));
        ast.Nodes.Single(node => node.Label == "app").HasPrivateEndpointAccess.Should().BeTrue();

        DiagramEdge? inSubnet = DiagramEdgeVisibility.VisibleEdges(ast.Edges)
            .SingleOrDefault(edge => string.Equals(edge.Label, "in", StringComparison.OrdinalIgnoreCase));
        inSubnet.Should().NotBeNull();
        ast.Nodes.Should().Contain(node =>
            node.NodeId == inSubnet!.FromNodeId && string.Equals(node.Label, "app", StringComparison.Ordinal));
        ast.Nodes.Should().Contain(node =>
            node.NodeId == inSubnet!.ToNodeId && string.Equals(node.Label, "data", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_full_subscription_draws_contains_from_arm_nesting_without_stored_edge()
    {
        GraphSnapshot graph = BuildVnetSubnetGraphWithoutContainsEdge();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        DiagramEdge? contains = DiagramEdgeVisibility.VisibleEdges(ast.Edges)
            .SingleOrDefault(edge => string.Equals(edge.Label, "contains", StringComparison.OrdinalIgnoreCase));
        contains.Should().NotBeNull();
        ast.Nodes.Should().Contain(node =>
            node.NodeId == contains!.FromNodeId && string.Equals(node.Label, "core-vnet", StringComparison.Ordinal));
        ast.Nodes.Should().Contain(node =>
            node.NodeId == contains!.ToNodeId && string.Equals(node.Label, "app", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_resource_group_hides_private_endpoint_unless_opted_in()
    {
        GraphSnapshot graph = BuildPrivateEndpointSqlSubnetGraph();

        DiagramAst hidden = compiler.Compile(
            graph,
            DiagramMode.ResourceGroup,
            new DiagramAstCompileOptions { ResourceGroupName = "rg" });

        hidden.Nodes.Should().NotContain(node => string.Equals(node.Label, "pe-sql", StringComparison.Ordinal));

        DiagramAst shown = compiler.Compile(
            graph,
            DiagramMode.ResourceGroup,
            new DiagramAstCompileOptions
            {
                ResourceGroupName = "rg",
                IncludePrivateEndpointNodes = true,
            });

        shown.Nodes.Should().Contain(node => string.Equals(node.Label, "pe-sql", StringComparison.Ordinal));
    }

    private static GraphSnapshot BuildVmNicSubnetGraph()
    {
        const string vmArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-app";
        const string nicArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/vm-app-nic";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-app/subnets/app";

        GraphSnapshot graph = new()
        {
            Nodes =
            [
                BuildTopologyNode("vm-1", vmArmId, "Microsoft.Compute/virtualMachines", "vm-app"),
                BuildTopologyNode("nic-1", nicArmId, "Microsoft.Network/networkInterfaces", "vm-app-nic"),
                BuildTopologyNode("subnet-1", subnetArmId, "Microsoft.Network/virtualNetworks/subnets", "app"),
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "edge-vm-nic",
                    FromNodeId = "vm-1",
                    ToNodeId = "nic-1",
                    EdgeType = AzureInventoryRelationshipAssociationTypes.VmToNic,
                    Label = AzureInventoryRelationshipAssociationTypes.VmToNic,
                    InferenceSource = GraphEdgeInferenceSources.InventoryVmNic,
                    Weight = 1.0d,
                },
                new GraphEdge
                {
                    EdgeId = "edge-nic-subnet",
                    FromNodeId = "nic-1",
                    ToNodeId = "subnet-1",
                    EdgeType = AzureInventoryRelationshipAssociationTypes.NicToSubnet,
                    Label = AzureInventoryRelationshipAssociationTypes.NicToSubnet,
                    InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
                    Weight = 1.0d,
                },
            ],
        };

        return graph;
    }

    private static GraphSnapshot BuildPrivateEndpointSqlSubnetGraph()
    {
        const string peArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe-sql";
        const string sqlArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql/databases/app";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/data";

        return new GraphSnapshot
        {
            Nodes =
            [
                BuildTopologyNode("pe-1", peArmId, "Microsoft.Network/privateEndpoints", "pe-sql"),
                BuildTopologyNode("sql-1", sqlArmId, "Microsoft.Sql/servers/databases", "app"),
                BuildTopologyNode("subnet-1", subnetArmId, "Microsoft.Network/virtualNetworks/subnets", "data"),
            ],
            Edges =
            [
                new GraphEdge
                {
                    EdgeId = "edge-pe-sql",
                    FromNodeId = "pe-1",
                    ToNodeId = "sql-1",
                    EdgeType = GraphEdgeTypes.ConnectsTo,
                    Label = AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
                    InferenceSource = GraphEdgeInferenceSources.InventoryPrivateEndpoint,
                    Weight = 1.0d,
                },
                new GraphEdge
                {
                    EdgeId = "edge-pe-subnet",
                    FromNodeId = "pe-1",
                    ToNodeId = "subnet-1",
                    EdgeType = AzureInventoryRelationshipAssociationTypes.PeToSubnet,
                    Label = AzureInventoryRelationshipAssociationTypes.PeToSubnet,
                    InferenceSource = GraphEdgeInferenceSources.InventoryPeSubnet,
                    Weight = 1.0d,
                },
            ],
        };
    }

    private static GraphSnapshot BuildVnetSubnetGraphWithoutContainsEdge()
    {
        const string vnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/core-vnet";
        const string subnetArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/core-vnet/subnets/app";

        return new GraphSnapshot
        {
            Nodes =
            [
                BuildTopologyNode("vnet-1", vnetArmId, "Microsoft.Network/virtualNetworks", "core-vnet"),
                BuildTopologyNode("subnet-1", subnetArmId, "Microsoft.Network/virtualNetworks/subnets", "app"),
            ],
        };
    }

    private static GraphNode BuildTopologyNode(string nodeId, string armId, string armType, string label)
    {
        GraphNode node = new()
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
        };
        node.Properties["arm.id"] = armId;
        node.Properties["arm.type"] = armType;
        node.Properties["arm.resourceGroup"] = "rg";
        node.Properties["arm.subscriptionId"] = "sub";

        return node;
    }
}
