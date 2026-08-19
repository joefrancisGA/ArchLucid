using ArchLucid.Api.Models.Evolution;
using ArchLucid.Contracts.Evolution;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Models.Evolution;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class EvolutionOutcomeParserTests
{
    [Fact]
    public void ToRunWithEvaluation_throws_when_record_is_null()
    {
        Action act = () => EvolutionOutcomeParser.ToRunWithEvaluation(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void ToRunWithEvaluation_maps_base_fields_without_parsed_evaluation_when_outcome_blank()
    {
        DateTime completedUtc = new(2026, 7, 3, 10, 0, 0, DateTimeKind.Utc);
        Guid simulationRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        EvolutionSimulationRunRecord record = new()
        {
            SimulationRunId = simulationRunId,
            CandidateChangeSetId = Guid.NewGuid(),
            BaselineArchitectureRunId = "baseline",
            EvaluationMode = EvolutionEvaluationModeValues.ReadOnlyArchitectureAnalysis,
            OutcomeJson = "   ",
            WarningsJson = "[\"warn\"]",
            CompletedUtc = completedUtc,
            IsShadowOnly = true,
        };

        EvolutionSimulationRunWithEvaluationResponse response = EvolutionOutcomeParser.ToRunWithEvaluation(record);

        response.SimulationRunId.Should().Be(simulationRunId);
        response.BaselineArchitectureRunId.Should().Be("baseline");
        response.EvaluationMode.Should().Be(record.EvaluationMode);
        response.OutcomeJson.Should().Be(record.OutcomeJson);
        response.WarningsJson.Should().Be(record.WarningsJson);
        response.CompletedUtc.Should().Be(completedUtc);
        response.IsShadowOnly.Should().BeTrue();
        response.EvaluationScore.Should().BeNull();
        response.EvaluationExplanationSummary.Should().BeNull();
        response.OutcomeSchemaVersion.Should().BeNull();
    }

    [Fact]
    public void ToRunWithEvaluation_parses_60R_v2_outcome_json()
    {
        const string outcomeJson =
            """
            {
              "schemaVersion": "60R-v2",
              "explanationSummary": "Shadow evaluation passed.",
              "evaluation": {
                "simulationScore": 0.91,
                "determinismScore": 0.88,
                "regressionRiskScore": 0.12,
                "improvementDelta": 0.05,
                "regressionSignals": ["latency"],
                "confidenceScore": 0.8
              }
            }
            """;

        EvolutionSimulationRunRecord record = new()
        {
            SimulationRunId = Guid.NewGuid(),
            CandidateChangeSetId = Guid.NewGuid(),
            BaselineArchitectureRunId = "baseline",
            OutcomeJson = outcomeJson,
            CompletedUtc = DateTime.UtcNow,
        };

        EvolutionSimulationRunWithEvaluationResponse response = EvolutionOutcomeParser.ToRunWithEvaluation(record);

        response.OutcomeSchemaVersion.Should().Be(EvolutionOutcomeParser.SchemaV2);
        response.EvaluationExplanationSummary.Should().Be("Shadow evaluation passed.");
        response.EvaluationScore.Should().NotBeNull();
        response.EvaluationScore!.SimulationScore.Should().Be(0.91);
        response.EvaluationScore.DeterminismScore.Should().Be(0.88);
        response.EvaluationScore.RegressionRiskScore.Should().Be(0.12);
        response.EvaluationScore.ImprovementDelta.Should().Be(0.05);
        response.EvaluationScore.RegressionSignals.Should().ContainSingle("latency");
        response.EvaluationScore.ConfidenceScore.Should().Be(0.8);
    }

    [Theory]
    [InlineData("{\"schemaVersion\":\"legacy\"}")]
    [InlineData("{not-json")]
    public void ToRunWithEvaluation_ignores_unsupported_or_invalid_outcome_json(string outcomeJson)
    {
        EvolutionSimulationRunRecord record = new()
        {
            SimulationRunId = Guid.NewGuid(),
            CandidateChangeSetId = Guid.NewGuid(),
            BaselineArchitectureRunId = "baseline",
            OutcomeJson = outcomeJson,
            CompletedUtc = DateTime.UtcNow,
        };

        EvolutionSimulationRunWithEvaluationResponse response = EvolutionOutcomeParser.ToRunWithEvaluation(record);

        response.EvaluationScore.Should().BeNull();
        response.EvaluationExplanationSummary.Should().BeNull();
        response.OutcomeSchemaVersion.Should().BeNull();
    }
}
