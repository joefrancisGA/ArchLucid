using ArchLucid.Contracts.Metadata;

namespace ArchLucid.Persistence.Data.Repositories;

internal static class ComparisonRecordPersistNormalizer
{
    internal static void NormalizeForPersist(ComparisonRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        record.ComparisonRecordId = record.ComparisonRecordId.Trim();
        ComparisonRecordRunIdSql.NormalizeRunIdsForRead(record);
        record.LeftExportRecordId = NormalizeExportRecordIdOrNull(record.LeftExportRecordId);
        record.RightExportRecordId = NormalizeExportRecordIdOrNull(record.RightExportRecordId);
    }

    private static string? NormalizeExportRecordIdOrNull(string? exportRecordId) =>
        string.IsNullOrWhiteSpace(exportRecordId)
            ? exportRecordId
            : ComparisonExportRecordIdLookup.NormalizeLookupKey(exportRecordId);
}
