using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceIdx07RatchetTests
{
    private static readonly DiagramMode[] PackingModes =
    [
        DiagramMode.Executive,
        DiagramMode.Architecture,
        DiagramMode.Network,
        DiagramMode.Security,
        DiagramMode.Identity,
        DiagramMode.Data,
        DiagramMode.FullSubscription,
        DiagramMode.ResourceGroup,
        DiagramMode.SelectedResources,
        DiagramMode.DependencyNeighborhood,
    ];

    private readonly DiagramForestLayoutSvgRenderer forestRenderer = new();
    private readonly DiagramAstFromGraphCompiler compiler = new();

    [Theory]
    [MemberData(nameof(PackingModeCases))]
    public void Mixed_resource_group_ast_stamps_role_columns_for_inventory_titles(DiagramMode mode)
    {
        string title = BuildInventoryTitle(mode);
        DiagramAst ast = InventoryDiagramExcellenceIdx07MixedRgAstBuilder.Build(title);
        DiagramForestLayoutResult layout = forestRenderer.Render(ast);

        layout.Succeeded.Should().BeTrue(layout.Error);
        InventoryDiagramExcellenceRatchetAssertions.AssertRoleColumnMarkersPresent(layout.Svg!, mode);
        InventoryDiagramExcellenceRatchetAssertions.AssertHubSpokeHubMarkerAbsent(layout.Svg!, mode);
    }

    [Theory]
    [MemberData(nameof(PackingModeCases))]
    public void Hub_star_resource_group_ast_stamps_hub_spoke_hub(DiagramMode mode)
    {
        string title = BuildInventoryTitle(mode);
        DiagramAst ast = InventoryDiagramExcellenceIdx07HubRgAstBuilder.Build(title);
        DiagramForestLayoutResult layout = forestRenderer.Render(ast);

        layout.Succeeded.Should().BeTrue(layout.Error);
        InventoryDiagramExcellenceRatchetAssertions.AssertHubSpokeHubMarkerPresent(layout.Svg!);
        InventoryDiagramExcellenceRatchetAssertions.AssertRoleColumnMarkersAbsent(layout.Svg!, mode);
    }

    [Fact]
    public void DataFlow_ast_keeps_stage_columns_without_role_column_markers()
    {
        DiagramAst ast = InventoryDiagramExcellenceIdx07MixedRgAstBuilder.Build(BuildInventoryTitle(DiagramMode.DataFlow));
        ast.Subgraphs =
        [
            new DiagramSubgraph { SubgraphId = "stage-source", Label = "Source", OrderKey = 0 },
        ];

        foreach (DiagramNode node in ast.Nodes)
        {
            node.SubgraphId = "stage-source";
        }

        DiagramForestLayoutResult layout = forestRenderer.Render(ast);
        layout.Succeeded.Should().BeTrue(layout.Error);
        InventoryDiagramExcellenceRatchetAssertions.AssertRoleColumnMarkersAbsent(
            layout.Svg!,
            DiagramMode.DataFlow);
    }

    [Fact]
    public void Compile_mixed_resource_group_graph_stamps_hub_when_compiler_assigns_stage_subgraphs()
    {
        DiagramAst ast = compiler.Compile(
            InventoryDiagramExcellenceIdx07MixedRgGraphFixture.Build(),
            DiagramMode.ResourceGroup,
            new DiagramAstCompileOptions { ResourceGroupName = "rg-app" });

        ast.Nodes.Should().Contain(node => !string.IsNullOrWhiteSpace(node.SubgraphId));

        DiagramForestLayoutResult layout = forestRenderer.Render(ast);
        layout.Succeeded.Should().BeTrue(layout.Error);
        InventoryDiagramExcellenceRatchetAssertions.AssertHubSpokeHubMarkerPresent(layout.Svg!);
    }

    public static TheoryData<DiagramMode> PackingModeCases { get; } = new(PackingModes);

    private static string BuildInventoryTitle(DiagramMode mode)
    {
        return mode switch
        {
            DiagramMode.ResourceGroup => "Azure inventory (ResourceGroup) — rg-app",
            DiagramMode.SelectedResources => "Azure inventory (SelectedResources)",
            DiagramMode.DependencyNeighborhood => "Azure inventory (DependencyNeighborhood)",
            _ => $"Azure inventory ({mode})",
        };
    }
}
