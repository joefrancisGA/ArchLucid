using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes end-to-end comparison report payloads before persist, rehydrate, and replay.
/// </summary>
internal static class EndToEndReplayComparisonReportNormalizer
{
    internal static void NormalizePersistedPayload(EndToEndReplayComparisonReport report)
    {
        ArgumentNullException.ThrowIfNull(report);

        report.LeftRunId = NormalizeReportRunIdAnchor(report.LeftRunId);
        report.RightRunId = NormalizeReportRunIdAnchor(report.RightRunId);

        ComparisonPersistedStringListNormalizer.NormalizeInPlace(report.Warnings);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(report.InterpretationNotes);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(report.RunDiff.ChangedFields);

        AgentResultDiffNormalizer.NormalizeInPlace(report.AgentResultDiff);
        ManifestDiffNormalizer.NormalizeInPlace(report.ManifestDiff);

        foreach (ExportRecordDiffResult diff in report.ExportDiffs)
            ExportRecordDiffResultNormalizer.NormalizeDisplayAnchors(diff);

        ComparisonFindingCorrelationMetadataNormalizer.NormalizeInPlace(report.FindingCorrelation);
        CrossReviewFindingLifecycleNormalizer.NormalizeOnReport(report);
        CompareQualityDeltaCountsNormalizer.NormalizeInPlace(report.CompareQualityDelta);

        CompareVerdictChromeDeltaNormalizer.NormalizeInPlace(report.CompareVerdictChromeDelta);

        if (report.CompareVerdictChromeDelta is { HasAnySection: false })
            report.CompareVerdictChromeDelta = null;
    }

    private static string NormalizeReportRunIdAnchor(string runId) =>
        string.IsNullOrWhiteSpace(runId) ? string.Empty : AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);
}
