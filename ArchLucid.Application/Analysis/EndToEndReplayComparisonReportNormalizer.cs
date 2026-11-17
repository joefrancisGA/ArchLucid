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
        RunMetadataDiffNormalizer.NormalizeInPlace(report.RunDiff);

        AgentResultDiffNormalizer.NormalizeInPlace(report.AgentResultDiff);
        if (report.AgentResultDiff is not null && AgentResultDiffNormalizer.IsPersistedEmptyShell(report.AgentResultDiff))
            report.AgentResultDiff = null;
        else
            BackfillNestedRunIdAnchorsFromReport(report);

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
            BackfillExportDiffRunIdsFromReport(diff, report);

            if (!ExportRecordDiffMateriality.HasMaterialChanges(diff))
                report.ExportDiffs.RemoveAt(i);
        }

        ExportRecordDiffMateriality.DedupeByExportRecordIdPairKeepFirstInPlace(report.ExportDiffs);

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

    internal static void ApplyComparisonRecordRunIdAnchorsInPlace(
        EndToEndReplayComparisonReport report,
        ComparisonRecord record)
    {
        ArgumentNullException.ThrowIfNull(report);
        ArgumentNullException.ThrowIfNull(record);

        if (report.LeftRunId.Length == 0)
        {
            string? left = AnalysisRunIdCanonicalization.CanonicalRunIdForLookupOrNull(record.LeftRunId);
            if (!string.IsNullOrEmpty(left))
                report.LeftRunId = left;
        }

        if (report.RightRunId.Length == 0)
        {
            string? right = AnalysisRunIdCanonicalization.CanonicalRunIdForLookupOrNull(record.RightRunId);
            if (!string.IsNullOrEmpty(right))
                report.RightRunId = right;
        }

        if (report.AgentResultDiff is not null)
            BackfillNestedRunIdAnchorsFromReport(report);

        foreach (ExportRecordDiffResult diff in report.ExportDiffs)
            BackfillExportDiffRunIdsFromReport(diff, report);
    }

    internal static bool IsPersistedImmaterialRehydrateShell(
        EndToEndReplayComparisonReport report,
        bool ignoreRunIdAnchors = false)
    {
        ArgumentNullException.ThrowIfNull(report);

        if (report.Warnings.Count > 0 || report.InterpretationNotes.Count > 0)
            return false;

        if (!ignoreRunIdAnchors && (report.LeftRunId.Length > 0 || report.RightRunId.Length > 0))
            return false;

        RunMetadataDiffResult runDiff = report.RunDiff;
        if (runDiff.ChangedFields.Count > 0
            || runDiff.RequestIdsDiffer
            || runDiff.ManifestVersionsDiffer
            || runDiff.StatusDiffers
            || runDiff.CompletionStateDiffers
            || runDiff.ExecutionModesDiffer
            || runDiff.ModelAliasIdsDiffer)
        {
            return false;
        }

        if (report.AgentResultDiff is not null
            || report.ManifestDiff is not null
            || report.ExportDiffs.Count > 0
            || report.FindingCorrelation is not null
            || report.FindingLifecycle is not null
            || report.FindingLifecycleRecords.Count > 0
            || report.CompareQualityDelta is not null
            || report.CompareVerdictChromeDelta is not null)
        {
            return false;
        }

        return true;
    }

    private static string NormalizeReportRunIdAnchor(string runId) =>
        string.IsNullOrWhiteSpace(runId) ? string.Empty : AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);

    private static void BackfillNestedRunIdAnchorsFromReport(EndToEndReplayComparisonReport report)
    {
        AgentResultDiffResult? agentDiff = report.AgentResultDiff;
        if (agentDiff is null)
            return;

        if (agentDiff.LeftRunId.Length == 0 && report.LeftRunId.Length > 0)
            agentDiff.LeftRunId = report.LeftRunId;

        if (agentDiff.RightRunId.Length == 0 && report.RightRunId.Length > 0)
            agentDiff.RightRunId = report.RightRunId;
    }

    private static void BackfillExportDiffRunIdsFromReport(ExportRecordDiffResult diff, EndToEndReplayComparisonReport report)
    {
        if (diff.LeftRunId.Length == 0 && report.LeftRunId.Length > 0)
            diff.LeftRunId = report.LeftRunId;

        if (diff.RightRunId.Length == 0 && report.RightRunId.Length > 0)
            diff.RightRunId = report.RightRunId;
    }
}
