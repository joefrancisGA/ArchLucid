using System.Text;

using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Retrieval;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class InsightGeneratorEvidenceSummaryTests
{
    [Fact]
    public void BuildUserPrompt_when_no_community_summaries_omits_community_section()
    {
        GraphSnapshot graph = CreateGraph();
        HashSet<string> allowedRefs = ["graph-node:sql-node"];

        string prompt = InsightGeneratorEvidenceSummary.BuildUserPrompt(
            [],
            graph,
            allowedRefs,
            maxFindings: 8,
            communitySummaries: null);

        prompt.Should().NotContain("Community summaries");
        prompt.Should().NotContain(InsightGeneratorEvidenceSummary.CommunitySummaryClaimBoundary);
        prompt.Should().NotContain("community:");
    }

    [Fact]
    public void BuildUserPrompt_when_community_summaries_present_includes_bounded_section()
    {
        GraphSnapshot graph = CreateGraph();
        List<InsightGeneratorCommunitySummary> summaries =
        [
            new()
            {
                CommunityId = "community-0",
                Summary = "PCI payment community egresses through a public Function hostname.",
            },
        ];

        HashSet<string> allowedRefs = InsightGeneratorEvidenceSummary.CollectAllowedEvidenceRefs(
            [],
            graph,
            summaries);

        string prompt = InsightGeneratorEvidenceSummary.BuildUserPrompt(
            [],
            graph,
            allowedRefs,
            maxFindings: 8,
            summaries);

        prompt.Should().Contain(InsightGeneratorEvidenceSummary.CommunitySummaryClaimBoundary);
        prompt.Should().Contain("Community summaries");
        prompt.Should().Contain("community:community-0");
        prompt.Should().Contain("PCI payment community egresses through a public Function hostname.");
        allowedRefs.Should().Contain("community:community-0");
    }

    [Fact]
    public void CollectAllowedEvidenceRefs_includes_only_listed_community_ids()
    {
        GraphSnapshot graph = CreateGraph();
        List<InsightGeneratorCommunitySummary> summaries =
        [
            new() { CommunityId = "community-0", Summary = "Summary A." },
            new() { CommunityId = "community-1", Summary = "Summary B." },
        ];

        HashSet<string> allowedRefs = InsightGeneratorEvidenceSummary.CollectAllowedEvidenceRefs(
            [],
            graph,
            summaries);

        allowedRefs.Should().Contain("community:community-0");
        allowedRefs.Should().Contain("community:community-1");
        allowedRefs.Should().NotContain("community:other");
    }

    [Fact]
    public void BuildUserPrompt_when_novelty_rates_present_includes_ranking_section()
    {
        GraphSnapshot graph = CreateGraph();
        HashSet<string> allowedRefs = ["graph-node:sql-node"];
        Dictionary<string, double> rates = new(StringComparer.OrdinalIgnoreCase)
        {
            ["dangling-declaration-reference"] = 0.8,
            ["topology-coverage"] = 0.0,
        };

        string prompt = InsightGeneratorEvidenceSummary.BuildUserPrompt(
            [],
            graph,
            allowedRefs,
            maxFindings: 8,
            communitySummaries: null,
            noveltyRatesByEngineType: rates);

        prompt.Should().Contain("Tenant novelty rates");
        prompt.Should().Contain("dangling-declaration-reference: 0.800");
        prompt.Should().Contain("topology-coverage: 0.000");
        prompt.Should().Contain(InsightDensityNoveltyRateLookup.InsightGeneratorClaimBoundary);
    }

    [Fact]
    public void AppendPreferredFindings_orders_by_novelty_rate_when_rates_present()
    {
        List<Finding> findings =
        [
            CreateSampleFinding("topology-coverage", "Topology gap", FindingSeverity.Warning),
            CreateSampleFinding("dangling-declaration-reference", "Dangling ref", FindingSeverity.Warning),
        ];

        Dictionary<string, double> rates = new(StringComparer.OrdinalIgnoreCase)
        {
            ["dangling-declaration-reference"] = 0.8,
            ["topology-coverage"] = 0.0,
        };

        string prompt = InsightGeneratorEvidenceSummary.BuildUserPrompt(
            findings,
            CreateGraph(),
            new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "graph-node:sql-node" },
            maxFindings: 8,
            noveltyRatesByEngineType: rates);

        prompt.IndexOf("Dangling ref", StringComparison.Ordinal)
            .Should()
            .BeLessThan(prompt.IndexOf("Topology gap", StringComparison.Ordinal));
    }

    private static Finding CreateSampleFinding(string engineType, string title, FindingSeverity severity)
    {
        return new Finding
        {
            FindingType = "SampleFinding",
            Category = "Security",
            EngineType = engineType,
            Severity = severity,
            Title = title,
            Rationale = "Sample rationale.",
            FindingId = Guid.NewGuid().ToString("d"),
        };
    }

    private static GraphSnapshot CreateGraph()
    {
        return new GraphSnapshot
        {
            Nodes =
            [
                new GraphNode
                {
                    NodeId = "sql-node",
                    NodeType = GraphNodeTypes.TopologyResource,
                    Label = "payments-db",
                },
            ],
        };
    }
}
