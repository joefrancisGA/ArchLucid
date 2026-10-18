using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Mermaid;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Renderers;
using ArchLucid.ArtifactSynthesis.Testing;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]
public sealed class InventoryDiagramExcellenceDataFlowHubPipelineHandExportStageLabelRatchetTests
{
    private readonly DiagramForestLayoutSvgRenderer forestRenderer = new();
    private readonly MermaidDiagramRenderPipeline mermaidPipeline = new(
        new MermaidDiagramRenderer(),
        new MermaidDiagramComplexityAnalyzer(),
        new MermaidDiagramDeterministicRepairer(),
        new MermaidDiagramStructuralValidator(),
        new MermaidDiagramSemanticIntegrityGuard(),
        new MermaidDiagramFallbackSetBuilder(
            new DiagramAstFromGraphCompiler(),
            new MermaidDiagramRenderer(),
            new MermaidDiagramComplexityAnalyzer(),
            new MermaidDiagramDeterministicRepairer(),
            new MermaidDiagramStructuralValidator(),
            new DiagramPeelCatalogDefaultProvider()));

    [Fact]
    public async Task InventoryDiagramExcellence_data_flow_hub_hand_pipeline_export_stage_labels_stay_paired()
    {
        DiagramAst ast = InventoryDiagramExcellenceDataFlowHubPipelineFixture.Build();

        DiagramForestLayoutResult forest = forestRenderer.Render(ast);
        forest.Succeeded.Should().BeTrue(forest.Error);

        MermaidDiagramRenderResult mermaid = await mermaidPipeline.RenderAsync(new MermaidDiagramRenderRequest { Ast = ast });
        mermaid.Status.Should().Be(MermaidDiagramRenderStatus.Succeeded);

        InventoryDiagramExcellenceDataFlowHubPipelineExportStageLabelAssertions.AssertAll(
            mermaid.PrimaryMermaid,
            XDocument.Parse(forest.Svg!));
    }
}
