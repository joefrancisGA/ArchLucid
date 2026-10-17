using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramExcellenceNestedFrameParityTests
{
    private readonly DiagramAstFromGraphCompiler compiler = new();
    private readonly DiagramForestLayoutSvgRenderer forestRenderer = new();
    private readonly DiagramAstGraphvizDotEmitter dotEmitter = new();

    [Theory]
    [InlineData(DiagramMode.Network)]
    [InlineData(DiagramMode.FullSubscription)]
    [InlineData(DiagramMode.ResourceGroup)]
    public void Dual_subnet_fixture_keeps_forest_and_dot_nested_frames_aligned(DiagramMode mode)
    {
        GraphSnapshot graph = InventoryDiagramExcellenceNestedSubnetGraphFixture.Build();
        DiagramAst ast = compiler.Compile(
            graph,
            mode,
            new DiagramAstCompileOptions
            {
                ResourceGroupName = mode == DiagramMode.ResourceGroup ? "network-rg" : null,
            });

        DiagramForestLayoutResult layout = forestRenderer.Render(ast);
        layout.Succeeded.Should().BeTrue(layout.Error);
        string dot = dotEmitter.Emit(ast);

        InventoryDiagramExcellenceRatchetAssertions.AssertForestAndDotNestedFrameParity(layout.Svg!, dot);
    }
}
