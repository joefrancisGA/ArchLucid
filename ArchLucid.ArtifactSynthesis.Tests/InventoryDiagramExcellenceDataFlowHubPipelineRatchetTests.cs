using System.Xml.Linq;

using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Testing;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
[Trait("InventoryDiagramExcellence", "DataFlowHubPipeline")]
public sealed class InventoryDiagramExcellenceDataFlowHubPipelineRatchetTests
{
    private readonly DiagramForestLayoutSvgRenderer renderer = new();

    [Fact]
    public void InventoryDiagramExcellence_data_flow_hub_pipeline_renders_with_rollup_and_routing_intact()
    {
        DiagramAst ast = InventoryDiagramExcellenceDataFlowHubPipelineFixture.Build();
        DiagramForestLayoutResult layout = renderer.Render(ast);

        layout.Succeeded.Should().BeTrue(layout.Error);
        XDocument svg = XDocument.Parse(layout.Svg!);

        CountHubMarkers(svg).Should().Be(1);
        InventoryDiagramExcellenceRatchetAssertions.AssertRoleColumnMarkersAbsent(
            layout.Svg!,
            DiagramMode.DataFlow);

        foreach (string nodeId in InventoryDiagramExcellenceDataFlowHubPipelineFixture.AllRenderableNodeIds())
        {
            svg.Descendants()
                .Any(element => element.Attribute("id")?.Value == $"node-{nodeId}")
                .Should()
                .BeTrue(nodeId);
        }

        DiagramForestDataFlowRollup.Result rollup = DiagramForestDataFlowRollup.Apply(ast.Nodes, ast.Edges);
        rollup.Nodes.Should().NotContain(node => node.IsDataFlowRollup);

        InventoryDiagramExcellenceDataFlowHubRoutingAssertions.AssertCrossStageRouteAvoidsSpokeCards(
            ast,
            svg,
            InventoryDiagramExcellenceDataFlowHubPipelineFixture.LandingNodeId,
            InventoryDiagramExcellenceDataFlowHubPipelineFixture.FactoryNodeId,
            InventoryDiagramExcellenceDataFlowHubPipelineFixture.SpokeNodeIds());

        // Paired Source/Ingestion stage headers: InventoryDiagramExcellenceDataFlowHubPipelineHandExportStageLabelRatchetTests (IDX-13q).
    }

    private static int CountHubMarkers(XDocument svg)
    {
        return svg.Descendants()
            .Count(element => element.Attribute("data-hub-spoke")?.Value == "hub");
    }
}
