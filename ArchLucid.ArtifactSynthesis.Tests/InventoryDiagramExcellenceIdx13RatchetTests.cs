using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceIdx13RatchetTests
{
    private static readonly DiagramMode[] Idx13Modes =
    [
        DiagramMode.Executive,
        DiagramMode.Architecture,
        DiagramMode.Network,
        DiagramMode.Security,
        DiagramMode.Identity,
        DiagramMode.Data,
        DiagramMode.DataFlow,
        DiagramMode.DataArchitecture,
        DiagramMode.FullSubscription,
        DiagramMode.ResourceGroup,
        DiagramMode.SelectedResources,
        DiagramMode.DependencyNeighborhood,
    ];

    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly DiagramForestLayoutSvgRenderer forestRenderer = new();
    private readonly DiagramAstGraphvizDotEmitter dotEmitter = new();

    [Theory]
    [MemberData(nameof(Idx13ModeCases))]
    public void Compile_fat_fixture_applies_mode_contract(DiagramMode mode)
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst ast = Compile(graph, mode);

        if (ast.Nodes.Count == 0)
        {
            throw new InvalidOperationException($"Expected nodes for {mode} but compile returned an empty AST.");
        }

        InventoryDiagramExcellenceRatchetAssertions.AssertLogicAppConnectionEdgesAreNotAClique(ast);
        InventoryDiagramExcellenceRatchetAssertions.AssertDataFlowRetainsStageSubgraphs(ast);
        InventoryDiagramExcellenceRatchetAssertions.AssertDataArchitectureRetainsTypeGroupSubgraphs(ast);
        InventoryDiagramExcellenceRatchetAssertions.AssertPeeringEdgesUsePeeringVerb(ast);

        DiagramForestLayoutResult layout = forestRenderer.Render(ast);
        layout.Succeeded.Should().BeTrue(layout.Error);
        InventoryDiagramExcellenceRatchetAssertions.AssertSubscriptionFramePolicy(layout.Svg!, mode);
        InventoryDiagramExcellenceRatchetAssertions.AssertVnetFramePolicy(
            layout.Svg!,
            mode,
            expectVnetMembersInAst: mode != DiagramMode.Identity);

        string dot = dotEmitter.Emit(ast);
        InventoryDiagramExcellenceRatchetAssertions.AssertDotResourceGroupClusterPolicy(dot, mode);
        InventoryDiagramExcellenceRatchetAssertions.AssertDotSubscriptionClusterPolicy(dot, mode);
        // 0 = 0 is success when a mode filter leaves no nested frames.
        InventoryDiagramExcellenceRatchetAssertions.AssertForestAndDotNestedFrameParity(layout.Svg!, dot);
        InventoryDiagramExcellenceRatchetAssertions.AssertSubnetFramePolicy(layout.Svg!, mode);
    }

    [Fact]
    public void Neighborhood_summary_node_counts_differ_from_full_subscription()
    {
        GraphSnapshot graph = InventoryDiagramExcellenceSharedGraphFixture.BuildFatGraph();
        DiagramAst neighborhood = Compile(graph, DiagramMode.DependencyNeighborhood);
        DiagramAst full = Compile(graph, DiagramMode.FullSubscription);

        neighborhood.Nodes.Count.Should().BeLessThan(full.Nodes.Count);
    }

    public static TheoryData<DiagramMode> Idx13ModeCases { get; } = new(Idx13Modes);

    private DiagramAst Compile(GraphSnapshot graph, DiagramMode mode)
    {
        return compiler.Compile(
            graph,
            mode,
            new DiagramAstCompileOptions
            {
                ResourceGroupName = mode == DiagramMode.ResourceGroup ? "network-rg" : null,
                NeighborhoodSeedNodeId = mode == DiagramMode.DependencyNeighborhood ? "vm-1" : null,
                SelectedNodeIds = mode == DiagramMode.SelectedResources ? ["vm-1"] : null,
            });
    }
}
