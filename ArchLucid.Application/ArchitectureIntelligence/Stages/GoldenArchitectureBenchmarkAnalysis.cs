using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence.Stages;

public sealed class GoldenArchitectureBenchmarkAnalysis
{
    public required Dictionary<string, int> BeforeCounts { get; init; }

    public required Dictionary<string, int> AfterCounts { get; init; }

    public required Dictionary<string, int> DeltaCounts { get; init; }

    public required double PlantedDefectRecall { get; init; }

    public required List<string> PlantedDefectsDetected { get; init; }

    public required List<string> PlantedDefectsMissed { get; init; }

    public required int FalsePositiveCount { get; init; }

    public required Dictionary<string, int> FalsePositivesByDimension { get; init; }

    public required List<CategoryBenchmarkScore> CategoryScores { get; init; }

    public required bool MutationChangedFindings { get; init; }

    public required bool ReReviewTriggered { get; init; }

    public required bool Passed { get; init; }
}
