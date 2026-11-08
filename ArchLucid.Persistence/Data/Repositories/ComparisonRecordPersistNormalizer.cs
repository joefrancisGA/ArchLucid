using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Persistence.Data.Repositories;

internal static class ComparisonRecordPersistNormalizer
{
    internal static void NormalizeForPersist(ComparisonRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        record.ComparisonRecordId = ComparisonRecordIdLookup.NormalizeLookupKey(record.ComparisonRecordId);
        ComparisonRecordRunIdSql.NormalizeRunIdsForRead(record);
        record.LeftExportRecordId = NormalizeExportRecordIdOrNull(record.LeftExportRecordId);
        record.RightExportRecordId = NormalizeExportRecordIdOrNull(record.RightExportRecordId);
        record.ComparisonType = NormalizeRequiredStringColumn(record.ComparisonType);

        record.Label = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.Label);
        NormalizeTagsInPlace(record.Tags);
        record.LeftManifestVersion =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.LeftManifestVersion);
        record.RightManifestVersion =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.RightManifestVersion);
        record.Notes = OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.Notes);

        record.Format = NormalizeRequiredStringColumn(record.Format);
        record.SummaryMarkdown =
            OptionalExportMetadataStringNormalizer.NormalizeOptionalString(record.SummaryMarkdown);
    }

    private static void NormalizeTagsInPlace(List<string> tags)
    {
        for (int i = tags.Count - 1; i >= 0; i--)
        {
            if (string.IsNullOrWhiteSpace(tags[i]))
            {
                tags.RemoveAt(i);
                continue;
            }

            tags[i] = tags[i].Trim();
        }
    }

    private static string NormalizeRequiredStringColumn(string value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

    private static string? NormalizeExportRecordIdOrNull(string? exportRecordId)
    {
        if (string.IsNullOrWhiteSpace(exportRecordId))
            return null;

        return ComparisonExportRecordIdLookup.NormalizeLookupKey(exportRecordId);
    }
}
