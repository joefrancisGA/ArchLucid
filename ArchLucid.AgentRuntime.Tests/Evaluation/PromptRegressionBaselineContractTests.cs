using System.Text.Json;

using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

/// <summary>
/// Binds <c>scripts/ci/prompt_regression_baseline.json</c> (copied to output) to golden evaluator scores so CI fails
/// when prompt/handler changes regress Topology fixtures below committed floors.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class PromptRegressionBaselineContractTests
{
    private const string TraceId = "trace-prompt-regression-baseline";

    [Fact]
    public void Golden_topology_valid_fixture_meets_committed_prompt_regression_baseline()
    {
        BaselineMins baseline = BaselineMins.LoadFromOutput();
        baseline.TopologyMinStructural.Should().BeGreaterThan(0.0);
        baseline.TopologyMinSemantic.Should().BeGreaterThan(0.0);

        string fixturePath = Path.Combine(AppContext.BaseDirectory, "Fixtures", "GoldenAgentResults", "golden-agent-result-valid.json");
        string json = File.ReadAllText(fixturePath);

        AgentOutputEvaluator structural = new();
        AgentOutputSemanticEvaluator semantic = new();

        AgentOutputEvaluationScore structuralScore = structural.Evaluate(TraceId, json, AgentType.Topology);
        structuralScore.IsJsonParseFailure.Should().BeFalse();
        structuralScore.StructuralCompletenessRatio.Should().BeGreaterThanOrEqualTo(baseline.TopologyMinStructural);

        AgentOutputSemanticScore semanticScore = semantic.Evaluate(TraceId, json, AgentType.Topology);
        semanticScore.OverallSemanticScore.Should().BeGreaterThanOrEqualTo(baseline.TopologyMinSemantic);
    }

    private readonly struct BaselineMins
    {
        private BaselineMins(double topologyMinStructural, double topologyMinSemantic)
        {
            TopologyMinStructural = topologyMinStructural;
            TopologyMinSemantic = topologyMinSemantic;
        }

        public double TopologyMinStructural { get; }

        public double TopologyMinSemantic { get; }

        public static BaselineMins LoadFromOutput()
        {
            string path = Path.Combine(AppContext.BaseDirectory, "Fixtures", "Regression", "prompt_regression_baseline.json");

            if (!File.Exists(path))
            {
                throw new InvalidOperationException(
                    $"Missing baseline copy at {path}; ensure ArchLucid.AgentRuntime.Tests links scripts/ci/prompt_regression_baseline.json.");
            }

            using FileStream stream = File.OpenRead(path);
            using JsonDocument doc = JsonDocument.Parse(stream);
            JsonElement root = doc.RootElement;
            double topologyStruct = root.GetProperty("minStructuralCompletenessByAgentType").GetProperty("Topology").GetDouble();
            double topologySem = root.GetProperty("minSemanticScoreByAgentType").GetProperty("Topology").GetDouble();

            return new BaselineMins(topologyStruct, topologySem);
        }
    }
}
