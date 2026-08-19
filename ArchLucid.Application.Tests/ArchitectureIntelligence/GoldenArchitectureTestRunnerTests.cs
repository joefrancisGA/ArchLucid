using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class GoldenArchitectureTestRunnerTests
{
    [Fact]
    public async Task RunAsync_fixture_produces_before_after_and_category_scores()
    {
        ServiceCollection services = new();
        services.AddArchitectureIntelligence();
        services.AddArchitectureIntelligenceInMemoryPersistence();
        ServiceProvider provider = services.BuildServiceProvider();
        IGoldenArchitectureTestRunner runner = provider.GetRequiredService<IGoldenArchitectureTestRunner>();

        ClosedLoopReasoningRequest request = GoldenIncompleteArchitectureFixture.CreateRequest("tenant-golden");
        GoldenArchitectureTestResult result = await runner.RunAsync(request);

        result.BeforeCounts.Should().ContainKey(ArchitectureKnowledgeModelMetrics.HighSeverityFindings);
        result.AfterCounts.Should().ContainKey(ArchitectureKnowledgeModelMetrics.HighSeverityFindings);
        result.DeltaCounts.Should().NotBeEmpty();
        result.CategoryScores.Should().HaveCount(4);
        result.CategoryScores.Select(score => score.Category).Should().BeEquivalentTo(
        [
            BenchmarkScoreCategory.Extraction,
            BenchmarkScoreCategory.Construction,
            BenchmarkScoreCategory.Review,
            BenchmarkScoreCategory.Enhancement,
        ]);
        result.MutationChangedFindings.Should().BeTrue();
        result.FalsePositivesByDimension.Should().NotBeNull();
        result.Notes.Should().Contain("pre-apply");
    }
}
