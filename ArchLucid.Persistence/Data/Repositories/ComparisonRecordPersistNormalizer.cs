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
        if (!string.IsNullOrWhiteSpace(record.ComparisonType))
            record.ComparisonType = record.ComparisonType.Trim();

        record.Label = TrimLabelOrNull(record.Label);
        NormalizeTagsInPlace(record.Tags);
    }

    private static void NormalizeTagsInPlace(List<string> tags)
    {
        for (int i = 0; i < tags.Count; i++)
        {
            if (!string.IsNullOrWhiteSpace(tags[i]))
                tags[i] = tags[i].Trim();
        }
    }

    private static string? TrimLabelOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? value : value.Trim();

    private static string? NormalizeExportRecordIdOrNull(string? exportRecordId) =>
        string.IsNullOrWhiteSpace(exportRecordId)
            ? exportRecordId
            : ComparisonExportRecordIdLookup.NormalizeLookupKey(exportRecordId);
}
