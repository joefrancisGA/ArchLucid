using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramNicCollapseApplierTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly MermaidDiagramRenderer renderer = new();

    [Fact]
    public void Compile_full_subscription_hides_nic_and_draws_public_ip_to_virtual_machine()
    {
        GraphSnapshot graph = BuildVmPublicIpGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node =>
            string.Equals(node.ArmResourceType, "Microsoft.Network/networkInterfaces", StringComparison.OrdinalIgnoreCase));
        ast.Nodes.Should().Contain(node => string.Equals(node.Label, "pip-app", StringComparison.Ordinal));
        ast.Nodes.Should().Contain(node => string.Equals(node.Label, "vm-bam-dev-01", StringComparison.Ordinal));

        DiagramEdge? exposesEdge = DiagramEdgeVisibility.VisibleEdges(ast.Edges)
            .SingleOrDefault(edge => string.Equals(edge.Label, "exposes", StringComparison.OrdinalIgnoreCase));
        exposesEdge.Should().NotBeNull();
        exposesEdge!.InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryPublicIp);

        string mermaid = renderer.Render(ast);
        mermaid.Should().Contain("-->|\"exposes\"|");
        mermaid.Should().NotContain("vm-bam-dev-01-nic-01");
    }

    [Fact]
    public void Compile_executive_includes_public_ip_and_exposes_virtual_machine()
    {
        GraphSnapshot graph = BuildVmPublicIpGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Executive);

        ast.Nodes.Should().NotContain(node =>
            string.Equals(node.ArmResourceType, "Microsoft.Network/networkInterfaces", StringComparison.OrdinalIgnoreCase));
        ast.Nodes.Should().Contain(node => string.Equals(node.Label, "pip-app", StringComparison.Ordinal));
        ast.Nodes.Should().Contain(node => string.Equals(node.Label, "vm-bam-dev-01", StringComparison.Ordinal));

        DiagramEdgeVisibility.VisibleEdges(ast.Edges)
            .Should()
            .ContainSingle(edge => string.Equals(edge.Label, "exposes", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Compile_network_mode_includes_virtual_machine_without_network_interface_card()
    {
        GraphSnapshot graph = BuildVmPublicIpGraph();

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Network);

        ast.Nodes.Should().NotContain(node =>
            string.Equals(node.ArmResourceType, "Microsoft.Network/networkInterfaces", StringComparison.OrdinalIgnoreCase));
        ast.Nodes.Should().Contain(node => string.Equals(node.Label, "vm-bam-dev-01", StringComparison.Ordinal));
    }

    [Fact]
    public void Compile_does_not_draw_exposes_edge_when_virtual_machine_is_off_canvas()
    {
        GraphSnapshot graph = BuildVmPublicIpGraph(includeVirtualMachine: false);

        DiagramAst ast = compiler.Compile(graph, DiagramMode.FullSubscription);

        ast.Nodes.Should().NotContain(node =>
            string.Equals(node.ArmResourceType, "Microsoft.Network/networkInterfaces", StringComparison.OrdinalIgnoreCase));
        DiagramEdgeVisibility.VisibleEdges(ast.Edges)
            .Should()
            .NotContain(edge => string.Equals(edge.Label, "exposes", StringComparison.OrdinalIgnoreCase));
    }

    private static GraphSnapshot BuildVmPublicIpGraph(bool includeVirtualMachine = true)
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string resourceGroup = "rg-app";
        const string vmArmId =
            $"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Compute/virtualMachines/vm-bam-dev-01";
        const string nicArmId =
            $"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Network/networkInterfaces/vm-bam-dev-01-nic-01";
        const string pipArmId =
            $"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Network/publicIPAddresses/pip-app";
        const string subnetArmId =
            $"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Network/virtualNetworks/vnet-app/subnets/default";

        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        if (includeVirtualMachine)
        {
            graph.Nodes.Add(CreateTopologyNode(
                "vm-1",
                vmArmId,
                "Microsoft.Compute/virtualMachines",
                "vm-bam-dev-01",
                resourceGroup,
                subscriptionId,
                GraphTopologyCategories.Compute));
        }

        graph.Nodes.Add(CreateTopologyNode(
            "nic-1",
            nicArmId,
            "Microsoft.Network/networkInterfaces",
            "vm-bam-dev-01-nic-01",
            resourceGroup,
            subscriptionId,
            GraphTopologyCategories.Network));
        graph.Nodes.Add(CreateTopologyNode(
            "pip-1",
            pipArmId,
            "Microsoft.Network/publicIPAddresses",
            "pip-app",
            resourceGroup,
            subscriptionId,
            GraphTopologyCategories.Network));
        graph.Nodes.Add(CreateTopologyNode(
            "subnet-1",
            subnetArmId,
            "Microsoft.Network/virtualNetworks/subnets",
            "default",
            resourceGroup,
            subscriptionId,
            GraphTopologyCategories.Network));

        if (includeVirtualMachine)
        {
            graph.Edges.Add(new GraphEdge
            {
                EdgeId = "edge-vm-nic",
                FromNodeId = "vm-1",
                ToNodeId = "nic-1",
                EdgeType = AzureInventoryRelationshipAssociationTypes.VmToNic,
                Label = AzureInventoryRelationshipAssociationTypes.VmToNic,
                InferenceSource = GraphEdgeInferenceSources.InventoryVmNic,
                Weight = 1.0d,
            });
        }

        graph.Edges.Add(new GraphEdge
        {
            EdgeId = "edge-nic-subnet",
            FromNodeId = "nic-1",
            ToNodeId = "subnet-1",
            EdgeType = AzureInventoryRelationshipAssociationTypes.NicToSubnet,
            Label = AzureInventoryRelationshipAssociationTypes.NicToSubnet,
            InferenceSource = GraphEdgeInferenceSources.InventoryNicSubnet,
            Weight = 1.0d,
        });
        graph.Edges.Add(new GraphEdge
        {
            EdgeId = "edge-pip-nic",
            FromNodeId = "pip-1",
            ToNodeId = "nic-1",
            EdgeType = GraphEdgeTypes.Exposes,
            Label = AzureInventoryRelationshipAssociationTypes.PublicIpToNic,
            InferenceSource = GraphEdgeInferenceSources.InventoryPublicIp,
            Weight = 1.0d,
        });

        return graph;
    }

    private static GraphNode CreateTopologyNode(
        string nodeId,
        string armId,
        string armType,
        string label,
        string resourceGroup,
        string subscriptionId,
        string category)
    {
        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = category,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = armId,
                ["arm.type"] = armType,
                ["arm.resourceGroup"] = resourceGroup,
                ["arm.subscriptionId"] = subscriptionId,
                ["arm.region"] = "eastus",
            },
        };
    }
}
