using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

/// <summary>
/// CI release gate for ArchitectureIntelligence golden closed-loop (Suite=Core).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceGoldenRegressionTests
{
    [Fact]
    public async Task Golden_incomplete_fixture_meets_release_thresholds()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        await using ServiceProvider provider = services.BuildServiceProvider();

        IGoldenArchitectureTestRunner runner = provider.GetRequiredService<IGoldenArchitectureTestRunner>();
        ClosedLoopReasoningRequest request = GoldenIncompleteArchitectureFixture.CreateRequest("tenant-ci-golden");

        GoldenArchitectureTestResult result = await runner.RunAsync(request);

        result.Passed.Should().BeTrue("golden closed-loop must pass release gate");
        result.MutationChangedFindings.Should().BeTrue();
        result.CategoryScores.Should().HaveCount(4);
        result.CategoryScores.Select(score => score.Category).Should().Contain(
        [
            BenchmarkScoreCategory.Extraction,
            BenchmarkScoreCategory.Construction,
            BenchmarkScoreCategory.Review,
            BenchmarkScoreCategory.Enhancement,
        ]);
        result.BeforeCounts.Should().ContainKey(ArchitectureKnowledgeModelMetrics.HighSeverityFindings);
        result.AfterCounts.Should().ContainKey(ArchitectureKnowledgeModelMetrics.HighSeverityFindings);
        result.PlantedDefectsDetected.Should().NotBeNull();
        result.PlantedDefectsMissed.Should().NotBeNull();

        ArchitectureIntelligenceGoldenRecallBaseline.GoldenPlantedDefectRecallBaselineDocument baseline =
            ArchitectureIntelligenceGoldenRecallBaseline.Load();

        result.PlantedDefectRecall.Should().BeGreaterThanOrEqualTo(
            baseline.MinimumPlantedDefectRecall,
            "golden planted-defect recall must meet the committed CI floor");
        result.PlantedDefectRecall.Should().BeGreaterThanOrEqualTo(
            ArchitectureIntelligenceGoldenRecallPolicy.GoldenIncompleteMinimumRecall);

        result.FalsePositivesByDimension.Should().NotBeNull();
        ArchitectureIntelligenceFalsePositiveBudgetPolicy.IsWithinGoldenBudget(
            result.FalsePositivesByDimension,
            result.FalsePositiveCount).Should().BeTrue(
            "golden measured false positives must stay within per-dimension and total CI budgets");
    }
}
