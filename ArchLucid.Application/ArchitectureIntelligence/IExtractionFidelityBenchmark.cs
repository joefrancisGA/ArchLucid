using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public interface IExtractionFidelityBenchmark
{
    IReadOnlyList<ExtractionFidelityCase> MicroCases { get; }

    IReadOnlyList<ExtractionFidelityScore> Score(IDifficultyBasedExtractionRouter router);

    IReadOnlyList<ExtractionFidelityScore> ScoreCases(
        IDifficultyBasedExtractionRouter router,
        IReadOnlyList<ExtractionFidelityCase> cases);
}
