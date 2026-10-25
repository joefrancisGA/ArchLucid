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

        if (!string.IsNullOrWhiteSpace(diff.LeftRunId))
            diff.LeftRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(diff.LeftRunId);

        if (!string.IsNullOrWhiteSpace(diff.RightRunId))
            diff.RightRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(diff.RightRunId);

        PersistedAnalysisExportRequestMetadata.TrimOptionalStrings(diff.RequestDiff.LeftRequest);
        PersistedAnalysisExportRequestMetadata.TrimOptionalStrings(diff.RequestDiff.RightRequest);
        CanonicalizeNestedCompareRunId(diff.RequestDiff.LeftRequest);
        CanonicalizeNestedCompareRunId(diff.RequestDiff.RightRequest);
    }

    private static string NormalizeExportRecordIdAnchor(string? exportRecordId)
    {
        if (string.IsNullOrWhiteSpace(exportRecordId))
            return string.Empty;

        return RunExportRecordIdNormalizer.NormalizeRequired(exportRecordId);
    }

    private static void CanonicalizeNestedCompareRunId(PersistedAnalysisExportRequest? request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.CompareRunId))
            return;

        request.CompareRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(request.CompareRunId);
    }
}
