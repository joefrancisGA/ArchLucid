using ArchLucid.Core.Findings;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class InsightDensityLlmJudgmentParserTests
{
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
