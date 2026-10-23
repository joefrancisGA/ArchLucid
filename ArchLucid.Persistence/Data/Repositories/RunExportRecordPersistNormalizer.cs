using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Persistence.Data.Repositories;

internal static class RunExportRecordPersistNormalizer
{
    internal static void TrimOptionalStringColumns(RunExportRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        record.ExportType = record.ExportType.Trim();
        record.Format = record.Format.Trim();
        record.FileName = record.FileName.Trim();
        record.TemplateProfile = record.TemplateProfile?.Trim();
        record.TemplateProfileDisplayName = record.TemplateProfileDisplayName?.Trim();
        record.ResolutionReason = record.ResolutionReason?.Trim();
        record.ManifestVersion = record.ManifestVersion?.Trim();
        record.Notes = record.Notes?.Trim();
        record.CompareManifestVersion = record.CompareManifestVersion?.Trim();
        record.CompareRunId = record.CompareRunId?.Trim();
    }
}
