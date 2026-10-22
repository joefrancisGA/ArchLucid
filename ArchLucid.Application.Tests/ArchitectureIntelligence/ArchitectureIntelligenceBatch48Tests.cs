using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

/// <summary>TB-2342 batch 48: planted-defect recall floor + lifecycle batch helper coverage.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceBatch48Tests
{
    [Fact]
    public void Golden_recall_baseline_matches_policy_floor()
    {
        ArchitectureIntelligenceGoldenRecallBaseline.GoldenPlantedDefectRecallBaselineDocument baseline =
            ArchitectureIntelligenceGoldenRecallBaseline.Load();

        baseline.FixtureId.Should().Be("golden-incomplete");
        baseline.MatchingMethod.Should().Be("heuristic-title-pattern");
        baseline.MinimumPlantedDefectRecall.Should().Be(
            ArchitectureIntelligenceGoldenRecallPolicy.GoldenIncompleteMinimumRecall);
    }

    [Fact]
    public void Golden_recall_policy_floor_is_a_bounded_heuristic_gate()
    {
        ArchitectureIntelligenceGoldenRecallPolicy.GoldenIncompleteMinimumRecall.Should().BeGreaterThan(0.0);
        ArchitectureIntelligenceGoldenRecallPolicy.GoldenIncompleteMinimumRecall.Should().BeLessThanOrEqualTo(1.0);
    }

    [Fact]
    public void GetDeepCases_includes_golden_and_expanded_catalog()
    {
        ArchitectureIntelligenceBenchmark sut = new(new ExtractionFidelityBenchmark());

        IReadOnlyList<ArchitectureIntelligenceDeepCase> deepCases = sut.GetDeepCases();

        deepCases.Should().HaveCountGreaterThanOrEqualTo(8);
        deepCases.Should().Contain(deepCase =>
            deepCase.CaseId == GoldenIncompleteArchitectureFixture.DeepCaseId
            && deepCase.PlantedDefects.Count >= 3);
    }
}
