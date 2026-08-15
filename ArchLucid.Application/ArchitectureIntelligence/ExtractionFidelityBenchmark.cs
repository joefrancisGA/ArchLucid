using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ExtractionFidelityBenchmark : IExtractionFidelityBenchmark
{
    public IReadOnlyList<ExtractionFidelityCase> MicroCases { get; } =
    [
        new ExtractionFidelityCase
        {
            CaseId = "missing-rto-signal",
            SourceText = "The payment service must remain available during regional failover.",
            ExpectedElementKinds = [ArchitectureElementKind.Assumption],
            ExpectedNames = ["Unclassified architecture content"],
        },
        new ExtractionFidelityCase
        {
            CaseId = "public-endpoint-without-auth",
            SourceText = "Public API exposes customer records without authentication.",
            ExpectedElementKinds = [ArchitectureElementKind.Interface],
            ExpectedNames = ["Public endpoint"],
        },
        new ExtractionFidelityCase
        {
            CaseId = "unowned-component",
            SourceText = "The billing worker is an unowned component with no operational owner.",
            ExpectedElementKinds = [ArchitectureElementKind.OperationalOwnership],
            ExpectedNames = ["Unowned component"],
        },
        new ExtractionFidelityCase
        {
            CaseId = "diagram-prose-contradiction",
            SourceText = "The diagram contradicts the prose about database replication.",
            ExpectedElementKinds = [ArchitectureElementKind.UnresolvedQuestion],
            ExpectedNames = ["Diagram vs prose contradiction"],
        },
        new ExtractionFidelityCase
        {
            CaseId = "current-vs-target-state",
            SourceText = "Current state uses monolith. Target state uses microservices.",
            ExpectedElementKinds = [ArchitectureElementKind.Assumption],
            ExpectedNames = ["Current vs target state"],
        },
        new ExtractionFidelityCase
        {
            CaseId = "recovery-objective-present",
            SourceText = "RTO is 15 minutes and RPO is 5 minutes for order processing.",
            ExpectedElementKinds = [ArchitectureElementKind.RecoveryObjective],
            ExpectedNames = ["Recovery objective"],
        },
    ];

    public IReadOnlyList<ExtractionFidelityScore> Score(IDifficultyBasedExtractionRouter router)
    {
        return ScoreCases(router, MicroCases);
    }

    public IReadOnlyList<ExtractionFidelityScore> ScoreCases(
        IDifficultyBasedExtractionRouter router,
        IReadOnlyList<ExtractionFidelityCase> cases)
    {
        ArgumentNullException.ThrowIfNull(router);
        ArgumentNullException.ThrowIfNull(cases);

        List<ExtractionFidelityScore> scores = [];

        foreach (ExtractionFidelityCase microCase in cases)
        {
            IReadOnlyList<ArchitectureModelElement> extracted = router.Extract(
                microCase.SourceText,
                $"{ArchitectureIntelligenceArtifactPrefixes.KnownArtifactIdPrefix}bench");

            scores.Add(ScoreCase(microCase, extracted));
        }

        return scores;
    }

    private static ExtractionFidelityScore ScoreCase(
        ExtractionFidelityCase microCase,
        IReadOnlyList<ArchitectureModelElement> extracted)
    {
        List<string> extractedNames = extracted
            .Select(element => element.Name)
            .ToList();

        int matched = microCase.ExpectedNames.Count(expectedName =>
            extractedNames.Any(actualName =>
                actualName.Contains(expectedName, StringComparison.OrdinalIgnoreCase)
                || expectedName.Contains(actualName, StringComparison.OrdinalIgnoreCase)));

        double recall = microCase.ExpectedNames.Count == 0
            ? 1.0
            : (double)matched / microCase.ExpectedNames.Count;

        double precision = extractedNames.Count == 0
            ? (matched == 0 ? 1.0 : 0.0)
            : (double)matched / extractedNames.Count;

        return new ExtractionFidelityScore
        {
            CaseId = microCase.CaseId,
            Precision = precision,
            Recall = recall,
            Notes = $"Matched {matched} of {microCase.ExpectedNames.Count} expected names.",
        };
    }
}
