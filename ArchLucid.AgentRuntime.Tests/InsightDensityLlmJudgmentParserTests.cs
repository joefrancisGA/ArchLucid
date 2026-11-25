using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class InsightDensityLlmJudgmentParserTests
{
    [Fact]
    public void TryParse_returns_null_when_score_is_missing()
    {
        InsightDensityLlmJudgmentParser.TryParse("""{"findingId":"f1"}""", "f1")
            .Should().BeNull();
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(-1, 0)]
    [InlineData(101, 100)]
    public void TryParse_retains_explicit_zero_and_clamps_numeric_scores(int supplied, int expected)
    {
        InsightDensityLlmJudgment? parsed = InsightDensityLlmJudgmentParser.TryParse(
            $$"""{"findingId":"f1","insightDensityScore":{{supplied}} }""", "f1");

        parsed.Should().NotBeNull();
        parsed!.InsightDensityScore.Should().Be(expected);
    }

    [Fact]
    public void TryParse_returns_null_when_finding_id_mismatches()
    {
        InsightDensityLlmJudgment? parsed = InsightDensityLlmJudgmentParser.TryParse(
            """{"findingId":"other","insightDensityScore":50}""",
            "expected");

        parsed.Should().BeNull();
    }

    [Fact]
    public void TryParse_parses_valid_judgment()
    {
        InsightDensityLlmJudgment? parsed = InsightDensityLlmJudgmentParser.TryParse(
            """
            {
              "findingId": "f1",
              "insightDensityScore": 91,
              "whyThisIsNotGeneric": "Anchored to doc line.",
              "principalArchitectValue": "Principal value.",
              "decisionConsequence": "Change approval path.",
              "demoteToChecklist": false,
              "evidenceRefs": ["doc:manifest.json#services"]
            }
            """,
            "f1");

        parsed.Should().NotBeNull();
        parsed!.InsightDensityScore.Should().Be(91);
        parsed.DecisionConsequence.Should().Be("Change approval path.");
    }
}
