using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Topology;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TopologyCoverageAnalyzerMetamorphicTests
{
    private readonly GraphCoverageAnalyzer _analyzer = new();

    [Fact]
    public void Removing_disconnected_node_does_not_invent_new_missing_categories()
    {
        GraphSnapshot graph = TopologyAnalyzerMetamorphicGraphBuilder.BuildCoverageBaseline();
        TopologyCoverageResult before = _analyzer.AnalyzeTopology(graph);

        GraphSnapshot disconnected = TopologyAnalyzerMetamorphicGraphBuilder.AddIsolatedNode(
            graph,
            TopologyAnalyzerMetamorphicGraphBuilder.IsolatedComputeNode("cmp-disconnected", "batch"));

        TopologyCoverageResult afterDisconnected = _analyzer.AnalyzeTopology(disconnected);
        afterDisconnected.MissingCategories.Should().BeEquivalentTo(before.MissingCategories);

        GraphSnapshot removed = TopologyAnalyzerMetamorphicGraphBuilder.RemoveNode(disconnected, "cmp-disconnected");
        TopologyCoverageResult afterRemoval = _analyzer.AnalyzeTopology(removed);

        afterRemoval.MissingCategories.Should().BeEquivalentTo(before.MissingCategories);
        afterRemoval.PresentCategories.Should().BeEquivalentTo(before.PresentCategories);
    }
}
