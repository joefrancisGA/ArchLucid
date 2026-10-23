using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Persistence.Data.Repositories;

internal static class RunExportRecordPersistNormalizer
{
    internal static void NormalizeLoadedRecord(RunExportRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        record.RunId = record.RunId.Trim();
        TrimOptionalStringColumns(record);
    }

    internal static void TrimOptionalStringColumns(RunExportRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        record.ExportType = record.ExportType.Trim();
        record.Format = record.Format.Trim();
        record.FileName = record.FileName.Trim();
        record.TemplateProfile = NullIfWhiteSpace(record.TemplateProfile);
        record.TemplateProfileDisplayName = NullIfWhiteSpace(record.TemplateProfileDisplayName);
        record.ResolutionReason = NullIfWhiteSpace(record.ResolutionReason);
        record.ManifestVersion = NullIfWhiteSpace(record.ManifestVersion);
        record.Notes = NullIfWhiteSpace(record.Notes);
        record.CompareManifestVersion = NullIfWhiteSpace(record.CompareManifestVersion);
        record.CompareRunId = NullIfWhiteSpace(record.CompareRunId);
    }

    private static string? NullIfWhiteSpace(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }
}
