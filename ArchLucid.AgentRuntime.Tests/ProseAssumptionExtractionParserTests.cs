using ArchLucid.Core.Findings;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ProseAssumptionExtractionParserTests
{
    [Fact]
    public void Null_rows_do_not_discard_valid_candidates_or_consume_the_cap()
    {
        const string json = """
            {"assumptions":[null,
                {"statement":"first","documentPath":"a.md","lineNumber":1,"quotedSpan":"alpha","logicalPropertyName":"layout","impliedPropertyValue":"one"},
                null,
                {"statement":"second","documentPath":"b.md","lineNumber":2,"quotedSpan":"beta","logicalPropertyName":"layout","impliedPropertyValue":"two"},
                {"statement":"third","documentPath":"c.md","lineNumber":3,"quotedSpan":"gamma","logicalPropertyName":"layout","impliedPropertyValue":"three"}]}
            """;

        IReadOnlyList<ProseAssumptionCandidate> candidates = ProseAssumptionExtractionParser.TryParse(json, maxCandidates: 2);

        Assert.Equal(["first", "second"], candidates.Select(c => c.Statement));
        Assert.Equal(["doc:a.md#L1", "doc:b.md#L2"], candidates.Select(c => c.EvidenceRef));
    }

    [Fact]
    public void All_null_rows_return_no_candidates()
    {
        Assert.Empty(ProseAssumptionExtractionParser.TryParse("""{"assumptions":[null,null]}""", maxCandidates: 2));
    }
}
