using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// TB-1990 benchmark pyramid: visible microcases, held-out microcases, and mutation tests.
/// Held-out definitions must not be used during prompt iteration.
/// </summary>
public sealed partial class ArchitectureIntelligenceBenchmark : IArchitectureIntelligenceBenchmark
{
    private readonly IExtractionFidelityBenchmark _extractionFidelityBenchmark;

    public ArchitectureIntelligenceBenchmark(IExtractionFidelityBenchmark extractionFidelityBenchmark)
    {
        _extractionFidelityBenchmark = extractionFidelityBenchmark
            ?? throw new ArgumentNullException(nameof(extractionFidelityBenchmark));
    }

    public IReadOnlyList<ArchitectureIntelligenceDeepCase> GetDeepCases()
    {
        List<ArchitectureIntelligenceDeepCase> deepCases =
        [
            new ArchitectureIntelligenceDeepCase
            {
                CaseId = GoldenIncompleteArchitectureFixture.DeepCaseId,
                Title = "Golden incomplete claims intake architecture",
                SourceText = GoldenIncompleteArchitectureFixture.Content,
                PlantedDefects = GoldenIncompleteArchitectureFixture.ExpectedPlantedDefects.ToList(),
                ExpectedMutationIds = ["mutate-rto-30m", "mutate-remove-trust-boundary"],
            },
        ];

        deepCases.AddRange(ArchitectureIntelligenceDeepCaseCatalog.GetAdditionalDeepCases());

        return deepCases;
    }

    public IReadOnlyList<CategoryBenchmarkScore> ScoreCategories(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<ArchitectureRecommendation> recommendations,
        double plantedDefectRecall,
        bool mutationChangedFindings)
    {
        ArgumentNullException.ThrowIfNull(model);
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(recommendations);

        double extraction = model.Elements.Count == 0 ? 0.0 : Math.Min(1.0, model.Elements.Count / 6.0);
        int constructionSignal = model.Elements.Count(element =>
            element.Kind is ArchitectureElementKind.Component
                or ArchitectureElementKind.Decision
                or ArchitectureElementKind.QualityAttribute
                or ArchitectureElementKind.FunctionalRequirement);
        double construction = Math.Min(1.0, constructionSignal / 4.0);
        double review = Math.Clamp(plantedDefectRecall, 0.0, 1.0);
        double enhancement = Math.Min(
            1.0,
            (recommendations.Count > 0 ? 0.5 : 0.0) + (mutationChangedFindings ? 0.5 : 0.0));

        return
        [
            new CategoryBenchmarkScore
            {
                Category = BenchmarkScoreCategory.Extraction,
                Score = extraction,
                Detail = $"{model.Elements.Count} elements.",
            },
            new CategoryBenchmarkScore
            {
                Category = BenchmarkScoreCategory.Construction,
                Score = construction,
                Detail = $"{constructionSignal} construction signals.",
            },
            new CategoryBenchmarkScore
            {
                Category = BenchmarkScoreCategory.Review,
                Score = review,
                Detail = $"{findings.Count} findings; planted recall {plantedDefectRecall:0.00}.",
            },
            new CategoryBenchmarkScore
            {
                Category = BenchmarkScoreCategory.Enhancement,
                Score = enhancement,
                Detail = $"{recommendations.Count} recommendations; mutationChanged={mutationChangedFindings}.",
            },
        ];
    }

    public IReadOnlyList<ExtractionFidelityScore> ScoreExtraction(IDifficultyBasedExtractionRouter router)
    {
        ArgumentNullException.ThrowIfNull(router);

        // Visible cases only — held-out cases must not drive iteration scores.
        return _extractionFidelityBenchmark.Score(router);
    }
}
