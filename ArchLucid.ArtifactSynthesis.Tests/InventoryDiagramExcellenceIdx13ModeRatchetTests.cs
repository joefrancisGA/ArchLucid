using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceIdx13ModeRatchetTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();

    public static TheoryData<DiagramMode> AllDiagramModes { get; } = new(Enum.GetValues<DiagramMode>());

    [Theory]
    [MemberData(nameof(AllDiagramModes))]
    public void Compile_sample_graph_does_not_throw_for_every_mode(DiagramMode mode)
    {
        GraphSnapshot graph = BuildSampleGraph();
        DiagramAstCompileOptions options = new()
        {
            ResourceGroupName = mode == DiagramMode.ResourceGroup ? "network-rg" : null,
            NeighborhoodSeedNodeId = mode == DiagramMode.DependencyNeighborhood ? "vm-1" : null,
            SelectedNodeIds = mode == DiagramMode.SelectedResources ? ["vm-1"] : null,
        };

        DiagramAst ast = compiler.Compile(graph, mode, options);

        ast.Should().NotBeNull();

        if (mode is DiagramMode.Avd or DiagramMode.BusinessContinuity)
        {
            return;
        }

        ast.Nodes.Should().NotBeEmpty();
    }

    [Fact]
    public void Compile_identity_mode_does_not_surface_private_endpoint_nodes_by_default()
    {
        GraphSnapshot graph = BuildSampleGraph();
        graph.Nodes.Add(new GraphNode
        {
            NodeId = "pe-1",
            NodeType = GraphNodeTypes.TopologyResource,
            Label = "pe-kv",
            Category = GraphTopologyCategories.Network,
            SourceType = "azure-inventory-snapshot",
            SourceId = "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/network-rg/providers/Microsoft.Network/privateEndpoints/pe-kv",
            Properties = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["arm.id"] = "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/network-rg/providers/Microsoft.Network/privateEndpoints/pe-kv",
                ["arm.type"] = "Microsoft.Network/privateEndpoints",
                ["arm.resourceGroup"] = "network-rg",
            },
        });

        DiagramAst ast = compiler.Compile(graph, DiagramMode.Identity, new DiagramAstCompileOptions());

        ast.Nodes.Should().NotContain(node =>
            (node.ArmResourceType ?? string.Empty).Equals(
                "Microsoft.Network/privateEndpoints",
                StringComparison.OrdinalIgnoreCase));
    }

    private static GraphSnapshot BuildSampleGraph()
    {
        const string subscriptionId = "11111111-1111-1111-1111-111111111111";
        GraphSnapshot graph = new()
        {
            GraphSnapshotId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
        };

        graph.Nodes.Add(CreateTopologyNode(
            "vnet-1",
            "core-vnet",
            "Microsoft.Network/virtualNetworks",
            "network-rg",
            subscriptionId,
            GraphTopologyCategories.Network));
        graph.Nodes.Add(CreateTopologyNode(
            "subnet-1",
            "app-subnet",
            "Microsoft.Network/virtualNetworks/subnets",
            "network-rg",
            subscriptionId,
            GraphTopologyCategories.Network,
            parentArmId: $"/subscriptions/{subscriptionId}/resourceGroups/network-rg/providers/Microsoft.Network/virtualNetworks/core-vnet"));
        graph.Nodes.Add(CreateTopologyNode(
            "vm-1",
            "app-vm",
            "Microsoft.Compute/virtualMachines",
            "compute-rg",
            subscriptionId,
            GraphTopologyCategories.Compute));
        graph.Nodes.Add(CreateTopologyNode(
            "storage-1",
            "logs",
            "Microsoft.Storage/storageAccounts",
            "data-rg",
            subscriptionId,
            GraphTopologyCategories.Storage));
        graph.Nodes.Add(CreateTopologyNode(
            "identity-1",
            "app-id",
            "Microsoft.ManagedIdentity/userAssignedIdentities",
            "compute-rg",
            subscriptionId,
            GraphTopologyCategories.Identity));

        graph.Edges.Add(new GraphEdge
        {
            EdgeId = "contains-vnet-subnet",
            FromNodeId = "vnet-1",
            ToNodeId = "subnet-1",
            EdgeType = GraphEdgeTypes.Contains,
            Label = "contains",
            Weight = 1d,
        });

        return graph;
    }

    private static GraphNode CreateTopologyNode(
        string nodeId,
        string label,
        string armType,
        string resourceGroup,
        string subscriptionId,
        string category,
        string? parentArmId = null)
    {
        string armId =
            $"/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/{armType}/{label}";

        Dictionary<string, string> properties = new(StringComparer.Ordinal)
        {
            ["arm.id"] = armId,
            ["arm.type"] = armType,
            ["arm.resourceGroup"] = resourceGroup,
            ["arm.subscriptionId"] = subscriptionId,
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
