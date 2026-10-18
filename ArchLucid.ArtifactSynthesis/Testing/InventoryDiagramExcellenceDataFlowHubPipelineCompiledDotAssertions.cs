using ArchLucid.ArtifactSynthesis.Graphviz;
using ArchLucid.ArtifactSynthesis.Renderers;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Testing;

/// <summary>DOT export contract for the compiled Data Flow hub pipeline (IDX-13e / IDX-13j).</summary>
internal static class InventoryDiagramExcellenceDataFlowHubPipelineCompiledDotAssertions
{
    public static void AssertHubPipelineDot(string dot)
    {
        dot.Should().NotBeNullOrWhiteSpace();

        dot.Should().Contain("label=\"Source\"");
        dot.Should().Contain("label=\"Ingestion\"");

        string landingQuoted = GraphvizIdEscaper.QuoteIdentifier(MermaidIdSanitizer.Sanitize(InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.LandingGraphNodeId));
        string factoryQuoted = GraphvizIdEscaper.QuoteIdentifier(MermaidIdSanitizer.Sanitize(InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId));
        dot.Should().Contain(landingQuoted);
        dot.Should().Contain(factoryQuoted);
        dot.Should().Contain(GraphvizIdEscaper.QuoteIdentifier(MermaidIdSanitizer.Sanitize("st0")));
        dot.Should().Contain(GraphvizIdEscaper.QuoteIdentifier(MermaidIdSanitizer.Sanitize("st11")));

        AssertDirectedEdge(dot, InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.LandingGraphNodeId, InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId);
        AssertDirectedEdge(dot, InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId, "st0");
        AssertDirectedEdge(dot, InventoryDiagramExcellenceDataFlowHubPipelineGraphFixture.FactoryGraphNodeId, "st11");
    }

    public static void AssertHubPipelineDotUsesStableStageClusterIds(string dot)
    {
        dot.Should().Contain("cluster_data_flow_stage_source");
        dot.Should().Contain("cluster_data_flow_stage_ingestion");
    }

    private static void AssertDirectedEdge(string dot, string fromNodeId, string toNodeId)
    {
        string fromQuoted = GraphvizIdEscaper.QuoteIdentifier(MermaidIdSanitizer.Sanitize(fromNodeId));
        string toQuoted = GraphvizIdEscaper.QuoteIdentifier(MermaidIdSanitizer.Sanitize(toNodeId));

        bool found = dot
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(line =>
                line.Contains(fromQuoted, StringComparison.Ordinal)
                && line.Contains(toQuoted, StringComparison.Ordinal)
                && line.Contains("->", StringComparison.Ordinal));

        found.Should().BeTrue($"expected DOT edge {fromNodeId} → {toNodeId}");
    }
}
