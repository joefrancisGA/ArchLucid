using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

/// <summary>
/// Golden <see cref="AgentResult"/>-shaped JSON for <see cref="AgentOutputEvaluator"/> / <see cref="AgentOutputSemanticEvaluator"/> regression (see <c>docs/AGENT_OUTPUT_EVALUATION.md</c>).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class GoldenAgentResultJsonEvaluationTests
{
    private const string TraceId = "trace-golden-eval";

    private static readonly AgentOutputEvaluator Structural = new();
    private static readonly AgentOutputSemanticEvaluator Semantic = new();

    [Fact]
    public void Golden_valid_fixture_scores_full_structural_completeness()
    {
        string json = LoadFixtureText("golden-agent-result-valid.json");

        AgentOutputEvaluationScore score = Structural.Evaluate(TraceId, json, AgentType.Topology);

        score.IsJsonParseFailure.Should().BeFalse();
        score.StructuralCompletenessRatio.Should().Be(1.0);
        score.MissingKeys.Should().BeEmpty();
    }

    [Fact]
    public void Golden_valid_fixture_has_nonzero_semantic_score_from_findings_and_claims()
    {
        string json = LoadFixtureText("golden-agent-result-valid.json");

        AgentOutputSemanticScore semantic = Semantic.Evaluate(TraceId, json, AgentType.Topology);

        semantic.OverallSemanticScore.Should().BeGreaterThan(0.0);
        semantic.FindingsQualityRatio.Should().Be(1.0);
    }

    [Fact]
    public void Golden_partial_fixture_is_incomplete_structurally_but_parseable()
    {
        string json = LoadFixtureText("golden-agent-result-partial-keys.json");

        AgentOutputEvaluationScore score = Structural.Evaluate(TraceId, json, AgentType.Topology);

        score.IsJsonParseFailure.Should().BeFalse();
        score.StructuralCompletenessRatio.Should().BeLessThan(1.0);
        score.MissingKeys.Should().NotBeEmpty();
    }

    [Fact]
    public void Golden_non_json_fixture_is_structural_parse_failure()
    {
        string json = LoadFixtureText("golden-agent-result-not-json.txt");

        AgentOutputEvaluationScore score = Structural.Evaluate(TraceId, json, AgentType.Topology);

        score.IsJsonParseFailure.Should().BeTrue();
    }

    private static string LoadFixtureText(string fileName)
    {
        string dir = Path.Combine(AppContext.BaseDirectory, "Fixtures", "GoldenAgentResults");
        string path = Path.Combine(dir, fileName);

        return File.ReadAllText(path);
    }
}
