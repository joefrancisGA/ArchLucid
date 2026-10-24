namespace ArchLucid.Application.Analysis;

/// <summary>
///     Normalizes export-record diff anchor columns before markdown/docx export formatting.
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
    }
}
