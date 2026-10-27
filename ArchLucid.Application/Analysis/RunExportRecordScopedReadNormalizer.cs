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

        record.ExportType = record.ExportType.Trim();
        record.Format = record.Format.Trim();
        record.FileName = NormalizeExportFileName(record.FileName);
        record.TemplateProfile = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(record.TemplateProfile);
        record.TemplateProfileDisplayName =
            PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(record.TemplateProfileDisplayName);
        record.ResolutionReason = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(record.ResolutionReason);
        record.ManifestVersion = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(record.ManifestVersion);
        record.Notes = PersistedAnalysisExportRequestMetadata.NormalizeOptionalString(record.Notes);

        PersistedAnalysisExportRequestDeterminismNormalizer.NormalizeRunExportRecordDenormalizedColumns(record);
    }

    private static string NormalizeExportFileName(string fileName)
    {
        string trimmed = fileName.Trim();

        return trimmed.IndexOf('\\') >= 0
            ? trimmed.Replace('\\', '/')
            : trimmed;
    }
}
