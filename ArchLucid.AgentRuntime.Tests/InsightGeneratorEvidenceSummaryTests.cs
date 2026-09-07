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
