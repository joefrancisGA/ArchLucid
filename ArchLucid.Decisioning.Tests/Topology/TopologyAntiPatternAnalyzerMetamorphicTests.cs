using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Decisioning.Findings.Factories;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;

using FluentAssertions;

using FsCheck.Xunit;

namespace ArchLucid.Decisioning.Tests.Topology;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TopologyAntiPatternAnalyzerMetamorphicTests
{
    private readonly TopologyAntiPatternFindingEngine _engine = new();

    [Property(Arbitrary = [typeof(TopologyAnalyzerMetamorphicGraphArbitrary)], MaxTest = 60)]
    public void Relabeling_node_ids_preserves_anti_pattern_gap_codes(GraphSnapshot graph)
    {
        IReadOnlyList<string> before = GapCodes(graph);
        GraphSnapshot relabeled = TopologyAnalyzerMetamorphicGraphBuilder.RelabelNodes(graph, "m-");
        IReadOnlyList<string> after = GapCodes(relabeled);

        after.Should().BeEquivalentTo(before);
    }

    private IReadOnlyList<string> GapCodes(GraphSnapshot graph)
    {
        IReadOnlyList<Finding> findings =
            _engine.AnalyzeAsync(graph, CancellationToken.None).GetAwaiter().GetResult();

        return findings
            .Select(static finding => FindingPayloadConverter.ToTopologyGapPayload(finding)?.GapCode)
            .Where(static code => code is not null)
            .Select(static code => code!)
            .OrderBy(static c => c, StringComparer.Ordinal)
            .ToList();
    }
}
