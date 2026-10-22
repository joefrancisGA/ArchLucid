using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramHopFocusIdx12CompileTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Fact]
    public void Neighborhood_includes_vnet_across_hidden_nic_without_nic_card()
    {
        GraphSnapshot graph = BuildVmNicSubnetVnetGraph();
        graph.Nodes.Add(CreateNode(
            "other-vm",
            "other-vm",
            "Microsoft.Compute/virtualMachines",
            "rg-other",
            GraphTopologyCategories.Compute));
        DiagramAst neighborhood = compiler.Compile(
            graph,
            DiagramMode.DependencyNeighborhood,
            new DiagramAstCompileOptions { NeighborhoodSeedNodeId = "vm" });
        DiagramAst full = compiler.Compile(graph, DiagramMode.FullSubscription);

        neighborhood.Nodes.Should().Contain(node => node.Label == "app-vm");
        neighborhood.Nodes.Should().Contain(node => node.Label == "core-vnet");
        neighborhood.Nodes.Should().NotContain(node =>
            (node.ArmResourceType ?? string.Empty).Contains("networkInterfaces", StringComparison.OrdinalIgnoreCase));
        full.Nodes.Count.Should().BeGreaterThan(neighborhood.Nodes.Count);
    }

    [Fact]
    public void Selected_resources_pulls_cited_vnet_without_full_subscription()
    {
        GraphSnapshot graph = BuildVmNicSubnetVnetGraph();
        graph.Nodes.Add(CreateNode(
            "other-vm",
            "other-vm",
            "Microsoft.Compute/virtualMachines",
            "rg-other",
            GraphTopologyCategories.Compute));

        DiagramAst selected = compiler.Compile(
            graph,
            DiagramMode.SelectedResources,
            new DiagramAstCompileOptions { SelectedNodeIds = ["vm"] });

        selected.Nodes.Should().Contain(node => node.Label == "app-vm");
        selected.Nodes.Should().Contain(node => node.Label == "core-vnet");
        selected.Nodes.Should().NotContain(node => node.Label == "other-vm");
    }

    private static GraphSnapshot BuildVmNicSubnetVnetGraph()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        const string vnetArmId =
            $"/subscriptions/{subscriptionId}/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/core-vnet";
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        graph.Nodes.Add(CreateNode("vnet", "core-vnet", "Microsoft.Network/virtualNetworks", "rg-net", GraphTopologyCategories.Network));
        graph.Nodes.Add(CreateNode(
            "subnet",
            "app-subnet",
            "Microsoft.Network/virtualNetworks/subnets",
            "rg-net",
            GraphTopologyCategories.Network,
            parentArmId: vnetArmId));
        graph.Nodes.Add(CreateNode("nic", "app-nic", "Microsoft.Network/networkInterfaces", "rg-net", GraphTopologyCategories.Network));
        graph.Nodes.Add(CreateNode("vm", "app-vm", "Microsoft.Compute/virtualMachines", "rg-app", GraphTopologyCategories.Compute));

        graph.Edges.Add(CitedEdge("vm", "nic", AzureInventoryRelationshipAssociationTypes.NicToSubnet));
        graph.Edges.Add(CitedEdge("nic", "subnet", AzureInventoryRelationshipAssociationTypes.NicToSubnet));
        graph.Edges.Add(CitedEdge("subnet", "vnet", GraphEdgeTypes.Contains));

        return graph;
    }

    private static GraphEdge CitedEdge(string from, string to, string associationType)
    {
        AzureInventoryRelationshipAssociationTypeDefinition? definition =
            AzureInventoryRelationshipAssociationTypes.All
                .FirstOrDefault(item => string.Equals(item.AssociationType, associationType, StringComparison.OrdinalIgnoreCase));

        return new GraphEdge
        {
            EdgeId = $"{from}-{to}",
            FromNodeId = from,
            ToNodeId = to,
            EdgeType = definition?.DefaultGraphEdgeType ?? associationType,
            Weight = 1d,
            InferenceSource = definition?.DefaultInferenceSource ?? GraphEdgeInferenceSources.InventoryNicSubnet,
        };
    }

    private static GraphNode CreateNode(
        string nodeId,
        string label,
        string armType,
        string resourceGroup,
        string category,
        string? parentArmId = null)
    {
        string armId = $"/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/{resourceGroup}/providers/{armType}/{label}";
        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["arm.id"] = armId,
            ["arm.type"] = armType,
            ["arm.resourceGroup"] = resourceGroup,
            ["arm.subscriptionId"] = "11111111-1111-1111-1111-111111111111",
            ["arm.region"] = "eastus",
        };

        if (!string.IsNullOrWhiteSpace(parentArmId))
        {
            properties["arm.parentId"] = parentArmId;
        }

        return new GraphNode
        {
            NodeId = nodeId,
            NodeType = GraphNodeTypes.TopologyResource,
            Label = label,
            Category = category,
            SourceType = "azure-inventory-snapshot",
            SourceId = armId,
            Properties = properties,
        };
    }
}
