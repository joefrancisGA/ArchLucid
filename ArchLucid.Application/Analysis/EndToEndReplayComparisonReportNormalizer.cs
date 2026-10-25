using ArchLucid.Application.Diffs;
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
        if (report.AgentResultDiff is not null && AgentResultDiffNormalizer.IsPersistedEmptyShell(report.AgentResultDiff))
            report.AgentResultDiff = null;

        ManifestDiffNormalizer.NormalizeInPlace(report.ManifestDiff);
        if (report.ManifestDiff is not null
            && !ManifestDiffMateriality.HasMaterialChanges(report.ManifestDiff)
            && (report.ManifestDiff.InputFingerprints is null
                || CompareInputFingerprintsNormalizer.IsPersistedEmptyShell(report.ManifestDiff.InputFingerprints)))
            report.ManifestDiff = null;

        for (int i = report.ExportDiffs.Count - 1; i >= 0; i--)
        {
            ExportRecordDiffResult diff = report.ExportDiffs[i];
            ExportRecordDiffResultNormalizer.NormalizeDisplayAnchors(diff);

            if (!ExportRecordDiffMateriality.HasMaterialChanges(diff))
                report.ExportDiffs.RemoveAt(i);
        }

        ComparisonFindingCorrelationMetadataNormalizer.NormalizeInPlace(report.FindingCorrelation);
        if (report.FindingCorrelation is not null
            && ComparisonFindingCorrelationMetadataNormalizer.IsPersistedEmptyShell(report.FindingCorrelation))
            report.FindingCorrelation = null;

        CrossReviewFindingLifecycleNormalizer.NormalizeOnReport(report);
        CompareQualityDeltaCountsNormalizer.NormalizeInPlace(report.CompareQualityDelta);

        CompareVerdictChromeDeltaNormalizer.NormalizeInPlace(report.CompareVerdictChromeDelta);

        if (report.CompareVerdictChromeDelta is { HasAnySection: false })
            report.CompareVerdictChromeDelta = null;
    }

    private static string NormalizeReportRunIdAnchor(string runId) =>
        string.IsNullOrWhiteSpace(runId) ? string.Empty : AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);
}
