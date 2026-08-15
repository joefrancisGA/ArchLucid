using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

/// <summary>TB-2343 batch 49: held-out extraction isolation + per-dimension false-positive budgets.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceBatch49Tests
{
    [Fact]
    public void Held_out_governance_isolates_training_from_holdout_microcases()
    {
        ExtractionFidelityBenchmark extractionBenchmark = new();
        ArchitectureIntelligenceBenchmark benchmark = new(extractionBenchmark);

        ArchitectureIntelligenceHeldOutGovernance.AssertExtractionBenchmarkHasNoHeldOutCases(
            extractionBenchmark.MicroCases);
        ArchitectureIntelligenceHeldOutGovernance.AssertTrainingIsolation(
            benchmark.GetVisibleMicrocases(),
            benchmark.GetHeldOutMicrocases());
    }

    [Fact]
    public void ScoreHeldOutExtraction_scores_only_holdout_cases()
    {
        ArchitectureIntelligenceBenchmark benchmark = new(new ExtractionFidelityBenchmark());
        DifficultyBasedExtractionRouter router = new();

        IReadOnlyList<ExtractionFidelityScore> heldOutScores = benchmark.ScoreHeldOutExtraction(router);
        IReadOnlyList<ExtractionFidelityCase> heldOutCases = benchmark.GetHeldOutMicrocases();

        heldOutScores.Should().HaveCount(heldOutCases.Count);
        heldOutScores.Select(score => score.CaseId).Should().BeEquivalentTo(heldOutCases.Select(c => c.CaseId));
        heldOutScores.Should().OnlyContain(score => score.Recall >= 0 && score.Precision >= 0);
    }

    [Fact]
    public void Held_out_extraction_meets_committed_average_recall_floor()
    {
        ArchitectureIntelligenceBenchmark benchmark = new(new ExtractionFidelityBenchmark());
        DifficultyBasedExtractionRouter router = new();

        IReadOnlyList<ExtractionFidelityScore> heldOutScores = benchmark.ScoreHeldOutExtraction(router);
        double averageRecall = ArchitectureIntelligenceHeldOutExtractionPolicy.ComputeAverageRecall(heldOutScores);

        averageRecall.Should().BeGreaterThanOrEqualTo(
            ArchitectureIntelligenceHeldOutExtractionPolicy.MinimumHeldOutAverageRecall);
    }

    [Fact]
    public void False_positive_budget_policy_has_bounded_golden_limits()
    {
        ArchitectureIntelligenceFalsePositiveBudgetPolicy.GoldenIncompleteMaxFalsePositivesPerDimension
            .Should().BeGreaterThan(0);
        ArchitectureIntelligenceFalsePositiveBudgetPolicy.GoldenIncompleteMaxFalsePositivesTotal
            .Should().BeGreaterThan(
                ArchitectureIntelligenceFalsePositiveBudgetPolicy.GoldenIncompleteMaxFalsePositivesPerDimension);

        Dictionary<string, int> withinBudget = new(StringComparer.Ordinal)
        {
            ["Security"] = 2,
            ["Reliability"] = 1,
        };

        ArchitectureIntelligenceFalsePositiveBudgetPolicy.IsWithinGoldenBudget(withinBudget, 3).Should().BeTrue();

        Dictionary<string, int> perDimensionExceeded = new(StringComparer.Ordinal)
        {
            ["Security"] = ArchitectureIntelligenceFalsePositiveBudgetPolicy.GoldenIncompleteMaxFalsePositivesPerDimension + 1,
        };

        ArchitectureIntelligenceFalsePositiveBudgetPolicy.IsWithinGoldenBudget(perDimensionExceeded, 6).Should().BeFalse();
    }
}
