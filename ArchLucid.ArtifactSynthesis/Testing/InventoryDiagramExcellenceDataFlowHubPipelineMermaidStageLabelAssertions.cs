using ArchLucid.KnowledgeGraph.Inventory;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Testing;

/// <summary>Mermaid stage swimlane labels for the Data Flow hub pipeline (IDX-13l / IDX-13n).</summary>
internal static class InventoryDiagramExcellenceDataFlowHubPipelineMermaidStageLabelAssertions
{
    public static void AssertStageLabels(string mermaid)
    {
        mermaid.Should().NotBeNullOrWhiteSpace();

        mermaid.Should().Contain(AzureInventoryDataFlowStageNames.Source, "Mermaid must show the Source stage label");
        mermaid.Should().Contain(AzureInventoryDataFlowStageNames.Ingestion, "Mermaid must show the Ingestion stage label");
    }
}
