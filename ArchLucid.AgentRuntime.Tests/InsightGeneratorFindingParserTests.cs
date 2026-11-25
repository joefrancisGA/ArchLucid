using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InsightGeneratorFindingParserTests
{
    [Fact]
    public void TryParse_skips_null_rows_without_consuming_the_limit()
    {
        const string json = """
            {"findings":[null, {"title":"first","rationale":"r1","evidenceRefs":["ref1"]},
                null, {"title":"second","rationale":"r2","evidenceRefs":["ref2"]},
                {"title":"beyond limit","rationale":"r3","evidenceRefs":["ref3"]}]}
            """;

        IReadOnlyList<InsightGeneratorProposal> proposals = InsightGeneratorFindingParser.TryParse(json, maxFindings: 2);

        proposals.Select(p => p.Title).Should().Equal("first", "second");
        proposals.SelectMany(p => p.EvidenceRefs).Should().Equal("ref1", "ref2");
    }

    [Fact]
    public void TryParse_returns_empty_when_all_proposals_are_null()
    {
        InsightGeneratorFindingParser.TryParse("""{"findings":[null,null]}""", maxFindings: 2)
            .Should().BeEmpty();
    }
}
