using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// TB-1990: benchmark pyramid — microcases, mutation tests, and holdout-aware scoring.
/// </summary>
public interface IArchitectureIntelligenceBenchmark
{
    IReadOnlyList<ExtractionFidelityCase> GetVisibleMicrocases();

    IReadOnlyList<ExtractionFidelityCase> GetHeldOutMicrocases();

    IReadOnlyList<BenchmarkMutation> GetMutationTests();

    IReadOnlyList<ExtractionFidelityScore> ScoreExtraction(IDifficultyBasedExtractionRouter router);

    /// <summary>
    /// Applies a single-fact mutation description and returns whether specialist findings changed.
    /// </summary>
    bool MutationChangesFindings(
        ArchitectureKnowledgeModel beforeModel,
        BenchmarkMutation mutation,
        ISpecialistReviewService specialistReviewService);
}
