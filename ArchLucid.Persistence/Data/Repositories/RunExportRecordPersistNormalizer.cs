using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Persistence.Data.Repositories;

internal static class RunExportRecordPersistNormalizer
{
    internal static void NormalizeLoadedRecord(RunExportRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        record.ExportRecordId = ComparisonExportRecordIdLookup.NormalizeLookupKey(record.ExportRecordId);
        record.RunId = RunExportRecordRunIdSql.NormalizeRunIdForRead(record.RunId);
        TrimOptionalStringColumns(record);
    }

    internal static void TrimOptionalStringColumns(RunExportRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        record.ExportType = record.ExportType.Trim();
        record.Format = record.Format.Trim();
        record.FileName = record.FileName.Trim();
        record.TemplateProfile = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.TemplateProfile);
        record.TemplateProfileDisplayName =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.TemplateProfileDisplayName);
        record.ResolutionReason = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.ResolutionReason);
        record.ManifestVersion = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.ManifestVersion);
        record.Notes = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.Notes);
        record.CompareManifestVersion =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.CompareManifestVersion);
        record.CompareRunId = ComparisonRecordRunIdSql.ToCanonicalRunIdStringOrNull(record.CompareRunId);
    }
}
