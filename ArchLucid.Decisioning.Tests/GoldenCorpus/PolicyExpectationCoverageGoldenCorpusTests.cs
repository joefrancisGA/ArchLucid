using ArchLucid.Contracts.Findings.Payloads;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Models;
using ArchLucid.Decisioning.Services;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>
///     End-to-end regression: stamped policy expectation extras change coverage findings on a fixed graph.
/// </summary>
[Trait("Suite", "Core")]
public sealed class PolicyExpectationCoverageGoldenCorpusTests
{
    [Fact]
    public async Task Policy_stamped_identity_extra_changes_topology_coverage_missing_categories()
    {
        GraphSnapshot baselineGraph = CreateNetworkComputeOnlyGraph();
        GraphSnapshot stampedGraph = CreateNetworkComputeOnlyGraph();

        PolicyExpectationGraphStamp.Stamp(
            stampedGraph,
            new ArchLucid.Core.Governance.PolicyPacks.PolicyPackExpectationFacet(
                ["identity"],
                [],
                [],
                null,
                null));

        GraphCoverageAnalyzer analyzer = new();
        TopologyCoverageFindingEngine engine = new(analyzer);

        IReadOnlyList<Finding> baselineFindings = await engine.AnalyzeAsync(baselineGraph, CancellationToken.None);
        IReadOnlyList<Finding> stampedFindings = await engine.AnalyzeAsync(stampedGraph, CancellationToken.None);

        TopologyCoverageFindingPayload baselinePayload = ExtractTopologyPayload(baselineFindings);
        TopologyCoverageFindingPayload stampedPayload = ExtractTopologyPayload(stampedFindings);

        baselinePayload.MissingCategories.Contains("identity", StringComparer.OrdinalIgnoreCase).Should().BeFalse();
        stampedPayload.MissingCategories.Contains("identity", StringComparer.OrdinalIgnoreCase).Should().BeTrue();
        stampedPayload.MissingCategories.Should().Contain("storage");
        stampedPayload.MissingCategories.Should().Contain("data");
    }

    private static TopologyCoverageFindingPayload ExtractTopologyPayload(IReadOnlyList<Finding> findings)
    {
        Finding finding = findings.Should().ContainSingle().Subject;
        return finding.Payload.Should().BeOfType<TopologyCoverageFindingPayload>().Subject;
    }

    private static GraphSnapshot CreateNetworkComputeOnlyGraph()
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "context-1",
                    NodeType = GraphNodeTypes.ContextSnapshot,
                    Label = "scope",
                    Properties = new(),
                },
                new GraphNode
                {
                    NodeId = "net-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "vnet",
                    Category = GraphTopologyCategories.Network,
                    Properties = new(),
                },
                new GraphNode
                {
                    NodeId = "compute-1",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "app",
                    Category = GraphTopologyCategories.Compute,
                    Properties = new(),
                },
            ],
        };
    }
}
