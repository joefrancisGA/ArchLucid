using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Trims legacy padding on export records returned from scoped application reads and replay.
/// </summary>
internal static class RunExportRecordScopedReadNormalizer
{
    internal static void NormalizeInPlace(RunExportRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        record.ExportRecordId = RunExportRecordIdNormalizer.NormalizeRequired(record.ExportRecordId);
        record.RunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(record.RunId);

        record.CompareRunId = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(record.CompareRunId);
        if (!string.IsNullOrEmpty(record.CompareRunId))
            record.CompareRunId = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(record.CompareRunId);

        record.CompareManifestVersion =
            PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(record.CompareManifestVersion);

        record.ExportType = NormalizeExportTypeColumn(record.ExportType);
        record.Format = NormalizeFormatColumn(record.Format);
        record.FileName = NormalizeExportFileName(record.FileName);
        record.TemplateProfile = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(record.TemplateProfile);
        record.TemplateProfileDisplayName =
            PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(record.TemplateProfileDisplayName);
        record.ResolutionReason = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(record.ResolutionReason);
        record.ManifestVersion = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(record.ManifestVersion);
        record.Notes = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(record.Notes);

        PersistedAnalysisExportRequestDeterminismNormalizer.NormalizeRunExportRecordDenormalizedColumns(record);
    }

    private static string NormalizeExportFileName(string? fileName)
    {
        string? normalized = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(fileName);

        if (normalized is null)
            return string.Empty;

        return normalized.IndexOf('\\') >= 0
            ? normalized.Replace('\\', '/')
            : normalized;
    }

    private static string NormalizeFormatColumn(string? format) =>
        PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(format) ?? string.Empty;

    private static string NormalizeExportTypeColumn(string? exportType) =>
        PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(exportType) ?? string.Empty;
}
