using ArchLucid.Application.ArchitectureIntelligence;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ExtractionFidelityBenchmarkTests
{
    [Fact]
    public void Score_returns_scores_for_all_microcases()
    {
        ExtractionFidelityBenchmark benchmark = new();
        DifficultyBasedExtractionRouter router = new();

        IReadOnlyList<ArchLucid.Contracts.ArchitectureIntelligence.ExtractionFidelityScore> scores = benchmark.Score(router);

        scores.Should().HaveCount(benchmark.MicroCases.Count);
        scores.Should().OnlyContain(score => score.Precision >= 0 && score.Recall >= 0);
    }
}
