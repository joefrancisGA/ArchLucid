using System.Xml.Linq;

namespace ArchLucid.ArtifactSynthesis.Testing;

/// <summary>Mermaid + forest stage labels for hub pipeline export paths (IDX-13p).</summary>
internal static class InventoryDiagramExcellenceDataFlowHubPipelineExportStageLabelAssertions
{
    public static void AssertAll(string? mermaid, XDocument layoutSvg)
    {
        InventoryDiagramExcellenceDataFlowHubPipelineMermaidStageLabelAssertions.AssertStageLabels(mermaid!);
        InventoryDiagramExcellenceDataFlowHubPipelineForestStageLabelAssertions.AssertStageLabels(layoutSvg);
    }
}
