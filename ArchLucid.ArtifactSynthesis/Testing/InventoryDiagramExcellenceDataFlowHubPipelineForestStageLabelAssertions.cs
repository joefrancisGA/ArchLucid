using System.Xml.Linq;

using ArchLucid.KnowledgeGraph.Inventory;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Testing;

/// <summary>Forest LayoutSvg stage column labels for the Data Flow hub pipeline (IDX-13m / IDX-13n / IDX-13o).</summary>
internal static class InventoryDiagramExcellenceDataFlowHubPipelineForestStageLabelAssertions
{
    public static void AssertStageLabels(XDocument layoutSvg)
    {
        ArgumentNullException.ThrowIfNull(layoutSvg);

        IReadOnlyList<string> stageLabels = layoutSvg
            .Descendants()
            .Where(element => string.Equals(element.Attribute("class")?.Value, "data-flow-stage-label", StringComparison.Ordinal))
            .Select(element => (element.Value ?? string.Empty).Trim())
            .Where(label => label.Length > 0)
            .ToList();

        stageLabels.Should().Contain(AzureInventoryDataFlowStageNames.Source, "forest SVG must show the Source stage header");
        stageLabels.Should().Contain(AzureInventoryDataFlowStageNames.Ingestion, "forest SVG must show the Ingestion stage header");
    }
}
