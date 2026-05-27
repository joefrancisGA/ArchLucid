using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Queries;

/// <summary>Projects finding-engine coverage from a hydrated findings snapshot onto run query DTOs.</summary>
public static class RunFindingCoverageProjection
{
    public static void Apply(RunDetailDto dto, FindingsSnapshot? findingsSnapshot)
    {
        ArgumentNullException.ThrowIfNull(dto);

        (dto.DegradedFindingCoverage, dto.FindingCoverageSummary) = Build(findingsSnapshot);
    }

    public static (bool DegradedFindingCoverage, RunFindingCoverageSummary? Summary) Build(FindingsSnapshot? findingsSnapshot)
    {
        if (findingsSnapshot is null)
            return (false, null);

        RunFindingCoverageSummary summary = BuildSummary(findingsSnapshot, dispositionCoverage: null);
        bool degraded = summary.IsDegraded
                        || findingsSnapshot.EvaluationConfidenceEnrichmentSkipped;

        return (degraded, summary);
    }

    public static void ApplyDispositionCoverage(RunDetailDto dto, RunFindingDispositionCoverage? dispositionCoverage)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (dto.FindingCoverageSummary is null || dispositionCoverage is null || dto.FindingsSnapshot is null)
            return;

        dto.FindingCoverageSummary = BuildSummary(dto.FindingsSnapshot, dispositionCoverage);
    }

    private static RunFindingCoverageSummary BuildSummary(
        FindingsSnapshot findingsSnapshot,
        RunFindingDispositionCoverage? dispositionCoverage)
    {
        int failed = findingsSnapshot.EngineFailures.Count;
        int succeeded = failed == 0 && findingsSnapshot.GenerationStatus == FindingsSnapshotGenerationStatus.Complete
            ? Math.Max(1, EstimateSucceededEngines(findingsSnapshot))
            : Math.Max(0, EstimateSucceededEngines(findingsSnapshot));

        int attempted = failed + succeeded;
        bool blocking = FindingEngineFailureCommitClassifier.HasCommitBlockingFailures(findingsSnapshot.EngineFailures);
        bool degraded = findingsSnapshot.GenerationStatus == FindingsSnapshotGenerationStatus.PartiallyComplete
                        && !blocking
                        && failed > 0;

        List<string> failedLabels = findingsSnapshot.EngineFailures
            .Select(static f => $"{f.EngineType}/{f.Category}")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(static s => s, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new RunFindingCoverageSummary
        {
            EnginesAttempted = attempted,
            EnginesSucceeded = succeeded,
            EnginesFailed = failed,
            IsDegraded = degraded,
            HasCommitBlockingFailures = blocking,
            FailedEngineLabels = failedLabels,
            GenerationStatus = findingsSnapshot.GenerationStatus,
            DispositionCoverage = dispositionCoverage,
        };
    }

    private static int EstimateSucceededEngines(FindingsSnapshot findingsSnapshot)
    {
        if (findingsSnapshot.Findings.Count == 0 && findingsSnapshot.EngineFailures.Count == 0)
            return 0;

        HashSet<string> engineKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (Finding finding in findingsSnapshot.Findings)
        {
            string key = $"{finding.EngineType}|{finding.Category}";

            engineKeys.Add(key);
        }

        return engineKeys.Count;
    }
}
