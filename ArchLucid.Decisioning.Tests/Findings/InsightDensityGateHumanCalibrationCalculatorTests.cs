using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class InsightDensityGateHumanCalibrationCalculatorTests
{
    [Fact]
    public void ApplyResiduals_sets_null_rate_below_sample_floor()
    {
        List<InsightDensityGateHumanCalibrationRow> rows =
        [
            new()
            {
                EngineType = "identity-blast-radius",
                FindingCount = 4,
                DecisionGradeCount = 4,
                MedianScore = 80,
                DidNotThinkOfThatCount = 4,
                NoveltyRate = null,
            },
        ];

        InsightDensityGateHumanCalibrationCalculator.ApplyResiduals(rows);

        rows[0].Residual.Should().BeNull();
    }

    [Fact]
    public void ApplyResiduals_ranks_high_novelty_low_score_engine_above_over_scored_engine()
    {
        List<InsightDensityGateHumanCalibrationRow> rows =
        [
            new()
            {
                EngineType = "identity-blast-radius",
                FindingCount = 10,
                DecisionGradeCount = 10,
                MedianScore = 60,
                NoveltyRate = 0.8,
            },
            new()
            {
                EngineType = "topology-coverage",
                FindingCount = 10,
                DecisionGradeCount = 10,
                MedianScore = 85,
                NoveltyRate = 0.1,
            },
        ];

        InsightDensityGateHumanCalibrationCalculator.ApplyResiduals(rows);

        InsightDensityGateHumanCalibrationRow identity = rows.Single(row => row.EngineType == "identity-blast-radius");
        InsightDensityGateHumanCalibrationRow coverage = rows.Single(row => row.EngineType == "topology-coverage");

        identity.Residual.Should().BeGreaterThan(coverage.Residual!.Value);
    }
}
