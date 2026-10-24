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

        if (!string.IsNullOrWhiteSpace(diff.LeftExportRecordId))
            diff.LeftExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(diff.LeftExportRecordId);

        if (!string.IsNullOrWhiteSpace(diff.RightExportRecordId))
            diff.RightExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(diff.RightExportRecordId);

        if (!string.IsNullOrWhiteSpace(diff.LeftRunId))
            diff.LeftRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(diff.LeftRunId);

        if (!string.IsNullOrWhiteSpace(diff.RightRunId))
            diff.RightRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(diff.RightRunId);

        PersistedAnalysisExportRequestMetadata.TrimOptionalStrings(diff.RequestDiff.LeftRequest);
        PersistedAnalysisExportRequestMetadata.TrimOptionalStrings(diff.RequestDiff.RightRequest);
        CanonicalizeNestedCompareRunId(diff.RequestDiff.LeftRequest);
        CanonicalizeNestedCompareRunId(diff.RequestDiff.RightRequest);
    }

    private static void CanonicalizeNestedCompareRunId(PersistedAnalysisExportRequest? request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.CompareRunId))
            return;

        request.CompareRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(request.CompareRunId);
    }
}
