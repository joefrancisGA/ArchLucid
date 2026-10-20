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
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
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
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
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

}
