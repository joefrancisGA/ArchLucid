using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using FsCheck.Xunit;

namespace ArchLucid.Decisioning.Tests.Topology;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TopologyStructureAnalyzerMetamorphicTests
{
    [Property(Arbitrary = [typeof(TopologyAnalyzerMetamorphicGraphArbitrary)], MaxTest = 80)]
    public void Relabeling_node_ids_preserves_structure_gap_codes(GraphSnapshot graph)
    {
        IReadOnlyList<string> before = GapCodes(TopologyStructureAnalyzer.Analyze(graph));
        GraphSnapshot relabeled = TopologyAnalyzerMetamorphicGraphBuilder.RelabelNodes(graph, "m-");

        IReadOnlyList<string> after = GapCodes(TopologyStructureAnalyzer.Analyze(relabeled));

        after.Should().BeEquivalentTo(before);
    }

    [Fact]
    public void Adding_isolated_compute_does_not_remove_existing_structure_gaps()
    {
        GraphSnapshot graph = TopologyAnalyzerMetamorphicGraphBuilder.BuildComputeWithoutNetworkAnchor();
        IReadOnlyList<string> before = GapCodes(TopologyStructureAnalyzer.Analyze(graph));

        GraphSnapshot expanded = TopologyAnalyzerMetamorphicGraphBuilder.AddIsolatedNode(
            graph,
            TopologyAnalyzerMetamorphicGraphBuilder.IsolatedComputeNode("cmp-extra", "worker"));

        IReadOnlyList<string> after = GapCodes(TopologyStructureAnalyzer.Analyze(expanded));

        after.Should().Contain(before);
    }

    [Fact]
    public void Edge_reversal_not_applicable_documented_for_directed_connectivity()
    {
        // CONNECTS_TO / DEPENDS_ON analyzers key off ToNodeId targets — no direction-insensitivity claim.
        true.Should().BeTrue();
    }

    private static IReadOnlyList<string> GapCodes(IReadOnlyList<TopologyStructureGap> gaps) =>
        gaps.Select(static g => g.GapCode).OrderBy(static c => c, StringComparer.Ordinal).ToList();
}
