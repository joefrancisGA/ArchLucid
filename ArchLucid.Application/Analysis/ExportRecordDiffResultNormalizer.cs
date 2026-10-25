using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes export-record diff anchors and nested request metadata before export formatting or drift compare.
/// </summary>
internal static class ExportRecordDiffResultNormalizer
{
    internal static void NormalizeDisplayAnchors(ExportRecordDiffResult diff)
    {
        ArgumentNullException.ThrowIfNull(diff);

        diff.LeftExportRecordId = NormalizeExportRecordIdAnchor(diff.LeftExportRecordId);
        diff.RightExportRecordId = NormalizeExportRecordIdAnchor(diff.RightExportRecordId);

        diff.LeftRunId = NormalizeRunIdAnchor(diff.LeftRunId);
        diff.RightRunId = NormalizeRunIdAnchor(diff.RightRunId);

        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.Warnings);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.ChangedTopLevelFields);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.RequestDiff.ChangedFlags);
        ComparisonPersistedStringListNormalizer.NormalizeInPlace(diff.RequestDiff.ChangedValues);

        PersistedAnalysisExportRequestMetadata.TrimOptionalStrings(diff.RequestDiff.LeftRequest);
        PersistedAnalysisExportRequestMetadata.TrimOptionalStrings(diff.RequestDiff.RightRequest);
        if (diff.RequestDiff.LeftRequest is not null)
            PersistedAnalysisExportRequestDeterminismNormalizer.ClearIterationsWhenCheckDisabled(diff.RequestDiff.LeftRequest);

        if (diff.RequestDiff.RightRequest is not null)
            PersistedAnalysisExportRequestDeterminismNormalizer.ClearIterationsWhenCheckDisabled(diff.RequestDiff.RightRequest);

        ClearEmptyNestedExportRequestShells(diff.RequestDiff);

        CanonicalizeNestedCompareRunId(diff.RequestDiff.LeftRequest);
        CanonicalizeNestedCompareRunId(diff.RequestDiff.RightRequest);
    }

    private static void ClearEmptyNestedExportRequestShells(ExportRecordRequestDiff requestDiff)
    {
        ArgumentNullException.ThrowIfNull(requestDiff);

        if (requestDiff.LeftRequest is not null
            && PersistedAnalysisExportRequestMetadata.IsPersistedEmptyShell(requestDiff.LeftRequest))
        {
            requestDiff.LeftRequest = null;
        }

        if (requestDiff.RightRequest is not null
            && PersistedAnalysisExportRequestMetadata.IsPersistedEmptyShell(requestDiff.RightRequest))
        {
            requestDiff.RightRequest = null;
        }
    }

    private static string NormalizeExportRecordIdAnchor(string? exportRecordId)
    {
        if (string.IsNullOrWhiteSpace(exportRecordId))
            return string.Empty;

        return RunExportRecordIdNormalizer.NormalizeRequired(exportRecordId);
    }

    private static string NormalizeRunIdAnchor(string? runId)
    {
        if (string.IsNullOrWhiteSpace(runId))
            return string.Empty;

        return AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId);
    }

    private static void CanonicalizeNestedCompareRunId(PersistedAnalysisExportRequest? request)
    {
        if (request is null)
            return;

        string? normalized = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(request.CompareRunId);
        if (string.IsNullOrEmpty(normalized))
        {
            request.CompareRunId = null;
            return;
        }

        request.CompareRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(normalized);
    }
}
