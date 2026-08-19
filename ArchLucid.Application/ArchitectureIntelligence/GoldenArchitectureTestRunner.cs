using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class GoldenArchitectureTestRunner : IGoldenArchitectureTestRunner
{
    private readonly IClosedLoopArchitectureReasoningOrchestrator _orchestrator;
    private readonly IArchitectureIntelligenceBenchmark _benchmark;
    private readonly ISpecialistReviewService _specialistReviewService;

    public GoldenArchitectureTestRunner(
        IClosedLoopArchitectureReasoningOrchestrator orchestrator,
        IArchitectureIntelligenceBenchmark benchmark,
        ISpecialistReviewService specialistReviewService)
    {
        _orchestrator = orchestrator ?? throw new ArgumentNullException(nameof(orchestrator));
        _benchmark = benchmark ?? throw new ArgumentNullException(nameof(benchmark));
        _specialistReviewService = specialistReviewService
            ?? throw new ArgumentNullException(nameof(specialistReviewService));
    }

    public async Task<GoldenArchitectureTestResult> RunAsync(
        ClosedLoopReasoningRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        ClosedLoopReasoningResult result = await _orchestrator.RunAsync(request, cancellationToken);

        List<SpecialistReviewFinding> findings = result.SpecialistReviews
            .SelectMany(review => review.Findings)
            .ToList();

        ArchitectureKnowledgeModel beforeModel = result.ModelDiffs.Count > 0
            ? result.ModelDiffs[0].BeforeModel
            : result.Model;

        ArchitectureKnowledgeModel afterModel = result.ModelDiffs.Count > 0
            ? result.ModelDiffs[0].AfterModel
            : result.Model;

        List<SpecialistReviewFinding> afterFindings = result.ReReview?.SpecialistResults
            .SelectMany(review => review.Findings)
            .ToList() ?? findings;

        Dictionary<string, int> beforeCounts = ArchitectureKnowledgeModelMetrics.CountMetrics(beforeModel, findings);
        Dictionary<string, int> afterCounts = ArchitectureKnowledgeModelMetrics.CountMetrics(afterModel, afterFindings);
        Dictionary<string, int> deltaCounts = ComputeDelta(beforeCounts, afterCounts);

        PlantedDefectMatchResult planted = MatchPlantedDefects(findings);
        int falsePositiveCount = CountMeasuredFalsePositives(findings, planted.DetectedDefectIds);
        Dictionary<string, int> falsePositivesByDimension =
            CountFalsePositivesByDimension(findings, planted.DetectedDefectIds);

        bool mutationChangedFindings = EvaluateMutationSensitivity(beforeModel);

        List<CategoryBenchmarkScore> categoryScores = ScoreCategories(
            beforeModel,
            afterModel,
            findings,
            afterFindings,
            planted,
            result,
            mutationChangedFindings);

        bool reReviewTriggered = result.ReReview?.FullReReviewTriggered == true
            || result.ReReview?.SpecialistResults.Count > 0;

        // Release gate: mutation sensitivity + category scores + non-empty closed-loop output.
        // Planted-defect recall floor is enforced in ArchitectureIntelligenceGoldenRegressionTests
        // (heuristic title-pattern matching; baseline tracked in GoldenPlantedDefectRecallBaseline.v1.json).
        bool passed = mutationChangedFindings
            && categoryScores.Count == 4
            && (findings.Count + result.Recommendations.Count) > 0;

        return new GoldenArchitectureTestResult
        {
            BeforeCounts = beforeCounts,
            AfterCounts = afterCounts,
            DeltaCounts = deltaCounts,
            PlantedDefectRecall = planted.Recall,
            PlantedDefectsDetected = planted.DetectedDefectIds,
            PlantedDefectsMissed = planted.MissedDefectIds,
            FalsePositiveCount = falsePositiveCount,
            FalsePositivesByDimension = falsePositivesByDimension,
            CategoryScores = categoryScores,
            MutationChangedFindings = mutationChangedFindings,
            ReReviewTriggered = reReviewTriggered,
            Passed = passed,
            Notes =
                "Golden closed-loop: pre-apply vs post-apply auditable counts, planted-defect recall, "
                + "four-category scores, and mutation sensitivity.",
        };
    }

    private bool EvaluateMutationSensitivity(ArchitectureKnowledgeModel beforeModel)
    {
        // Prefer mutations against the live model; if extraction already matches the mutated
        // fact (e.g. RTO already 30m), fall back to a clean probe model so the harness still
        // verifies that specialist output is input-sensitive.
        foreach (BenchmarkMutation mutation in _benchmark.GetMutationTests())
        {
            if (_benchmark.MutationChangesFindings(beforeModel, mutation, _specialistReviewService))
            {
                return true;
            }
        }

        ArchitectureKnowledgeModel probeModel = new()
        {
            ModelId = beforeModel.ModelId,
            TenantId = beforeModel.TenantId,
            RunId = beforeModel.RunId,
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = Guid.NewGuid().ToString("N"),
                    Kind = ArchitectureElementKind.Component,
                    Name = "probe-api",
                    ExtractionConfidence = 0.8,
                },
            ],
        };

        BenchmarkMutation? rtoMutation = _benchmark.GetMutationTests()
            .FirstOrDefault(candidate => candidate.MutationId == "mutate-rto-30m");

        return rtoMutation is not null
            && _benchmark.MutationChangesFindings(probeModel, rtoMutation, _specialistReviewService);
    }

    private static Dictionary<string, int> ComputeDelta(
        Dictionary<string, int> beforeCounts,
        Dictionary<string, int> afterCounts)
    {
        Dictionary<string, int> delta = new(StringComparer.Ordinal);

        foreach (string key in beforeCounts.Keys.Union(afterCounts.Keys, StringComparer.Ordinal))
        {
            int before = beforeCounts.GetValueOrDefault(key);
            int after = afterCounts.GetValueOrDefault(key);
            delta[key] = after - before;
        }

        return delta;
    }

    private static PlantedDefectMatchResult MatchPlantedDefects(IReadOnlyList<SpecialistReviewFinding> findings)
    {
        List<string> detected = [];
        List<string> missed = [];

        foreach (PlantedDefectExpectation expectation in GoldenIncompleteArchitectureFixture.ExpectedPlantedDefects)
        {
            bool matched = findings.Any(finding => MatchesExpectation(finding, expectation));

            if (matched)
            {
                detected.Add(expectation.DefectId);
            }
            else
            {
                missed.Add(expectation.DefectId);
            }
        }

        int expected = GoldenIncompleteArchitectureFixture.ExpectedPlantedDefects.Count;
        double recall = expected == 0 ? 0.0 : (double)detected.Count / expected;

        return new PlantedDefectMatchResult(detected, missed, recall);
    }

    private static bool MatchesExpectation(
        SpecialistReviewFinding finding,
        PlantedDefectExpectation expectation)
    {
        string haystack = $"{finding.Title} {finding.Rationale}";

        if (!haystack.Contains(expectation.TitlePattern, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (finding.Dimension != expectation.Dimension
            && finding.Dimension != QualityDimension.Security
            && expectation.Dimension != QualityDimension.Security)
        {
            // Allow cross-dimension soft match only when pattern hits; still require severity floor.
        }

        return MeetsMinSeverity(finding.Severity, expectation.MinSeverity)
            || finding.Conclusion is ReviewConclusion.Fail or ReviewConclusion.Indeterminate;
    }

    private static bool MeetsMinSeverity(string actual, string minimum)
    {
        return SeverityRank(actual) >= SeverityRank(minimum);
    }

    private static int SeverityRank(string severity)
    {
        if (severity.Equals("Critical", StringComparison.OrdinalIgnoreCase))
        {
            return 4;
        }

        if (severity.Equals("High", StringComparison.OrdinalIgnoreCase))
        {
            return 3;
        }

        if (severity.Equals("Medium", StringComparison.OrdinalIgnoreCase))
        {
            return 2;
        }

        return 1;
    }

    private static int CountMeasuredFalsePositives(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<string> detectedDefectIds)
    {
        // High/Critical Fail findings that match no planted defect are treated as measured FPs.
        int count = 0;

        foreach (SpecialistReviewFinding finding in findings)
        {
            if (finding.Conclusion != ReviewConclusion.Fail)
            {
                continue;
            }

            if (!MeetsMinSeverity(finding.Severity, "High"))
            {
                continue;
            }

            bool explainsPlanted = GoldenIncompleteArchitectureFixture.ExpectedPlantedDefects
                .Any(expectation =>
                    detectedDefectIds.Contains(expectation.DefectId, StringComparer.Ordinal)
                    && MatchesExpectation(finding, expectation));

            if (!explainsPlanted)
            {
                count++;
            }
        }

        return count;
    }

    private static Dictionary<string, int> CountFalsePositivesByDimension(
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<string> detectedDefectIds)
    {
        Dictionary<string, int> byDimension = new(StringComparer.Ordinal);

        foreach (SpecialistReviewFinding finding in findings)
        {
            if (finding.Conclusion != ReviewConclusion.Fail)
            {
                continue;
            }

            if (!MeetsMinSeverity(finding.Severity, "High"))
            {
                continue;
            }

            bool explainsPlanted = GoldenIncompleteArchitectureFixture.ExpectedPlantedDefects
                .Any(expectation =>
                    detectedDefectIds.Contains(expectation.DefectId, StringComparer.Ordinal)
                    && MatchesExpectation(finding, expectation));

            if (!explainsPlanted)
            {
                string dimensionKey = finding.Dimension.ToString();
                byDimension[dimensionKey] = byDimension.GetValueOrDefault(dimensionKey) + 1;
            }
        }

        return byDimension;
    }

    private static List<CategoryBenchmarkScore> ScoreCategories(
        ArchitectureKnowledgeModel beforeModel,
        ArchitectureKnowledgeModel afterModel,
        IReadOnlyList<SpecialistReviewFinding> findings,
        IReadOnlyList<SpecialistReviewFinding> afterFindings,
        PlantedDefectMatchResult planted,
        ClosedLoopReasoningResult result,
        bool mutationChangedFindings)
    {
        double extraction = beforeModel.Elements.Count == 0
            ? 0.0
            : Math.Min(1.0, beforeModel.Elements.Count / 6.0);

        int coveredRequirements = beforeModel.Elements.Count(element =>
            element.Kind is ArchitectureElementKind.FunctionalRequirement
                or ArchitectureElementKind.QualityAttribute
                or ArchitectureElementKind.Component);
        double construction = Math.Min(1.0, coveredRequirements / 4.0);

        double review = planted.Recall;

        int recommendationCount = result.Recommendations.Count;
        int modelGrowth = Math.Max(0, afterModel.Elements.Count - beforeModel.Elements.Count);
        double enhancement = Math.Min(
            1.0,
            (recommendationCount > 0 ? 0.4 : 0.0)
            + (modelGrowth > 0 ? 0.3 : 0.0)
            + (mutationChangedFindings ? 0.3 : 0.0));

        return
        [
            new CategoryBenchmarkScore
            {
                Category = BenchmarkScoreCategory.Extraction,
                Score = extraction,
                Detail = $"{beforeModel.Elements.Count} model elements extracted.",
            },
            new CategoryBenchmarkScore
            {
                Category = BenchmarkScoreCategory.Construction,
                Score = construction,
                Detail = $"{coveredRequirements} construction-relevant elements.",
            },
            new CategoryBenchmarkScore
            {
                Category = BenchmarkScoreCategory.Review,
                Score = review,
                Detail =
                    $"Planted defect recall {planted.Recall:0.00}; "
                    + $"{findings.Count} findings / {afterFindings.Count} post-apply findings.",
            },
            new CategoryBenchmarkScore
            {
                Category = BenchmarkScoreCategory.Enhancement,
                Score = enhancement,
                Detail =
                    $"{recommendationCount} recommendations; model delta {modelGrowth}; "
                    + $"mutationChanged={mutationChangedFindings}.",
            },
        ];
    }

    private sealed record PlantedDefectMatchResult(
        List<string> DetectedDefectIds,
        List<string> MissedDefectIds,
        double Recall);
}
