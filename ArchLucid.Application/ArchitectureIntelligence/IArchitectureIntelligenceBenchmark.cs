using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// TB-1990: benchmark pyramid — microcases, deep cases, mutation tests, and holdout-aware scoring.
/// </summary>
public interface IArchitectureIntelligenceBenchmark
{
    IReadOnlyList<ExtractionFidelityCase> GetVisibleMicrocases();

    IReadOnlyList<ExtractionFidelityCase> GetHeldOutMicrocases();

    IReadOnlyList<BenchmarkMutation> GetMutationTests();

    IReadOnlyList<ArchitectureIntelligenceDeepCase> GetDeepCases();

    IReadOnlyList<ExtractionFidelityScore> ScoreExtraction(IDifficultyBasedExtractionRouter router);

    /// <summary>Scores held-out extraction microcases — never mixed into visible iteration scores.</summary>
    IReadOnlyList<ExtractionFidelityScore> ScoreHeldOutExtraction(IDifficultyBasedExtractionRouter router);

    /// <summary>
    /// Applies a single-fact mutation description and returns whether specialist findings changed.
    /// </summary>
    bool MutationChangesFindings(
        ArchitectureKnowledgeModel beforeModel,
        BenchmarkMutation mutation,
        ISpecialistReviewService specialistReviewService);

    IReadOnlyList<CategoryBenchmarkScore> ScoreCategories(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations,
        double plantedDefectRecall,
        bool mutationChangedFindings);
}
