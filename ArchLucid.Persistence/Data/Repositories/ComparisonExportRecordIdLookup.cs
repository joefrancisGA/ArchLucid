namespace ArchLucid.Persistence.Data.Repositories;

internal static class ComparisonExportRecordIdLookup
{
    internal static string NormalizeLookupKey(string exportRecordId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(exportRecordId);
        return exportRecordId.Trim();
    }

    internal static bool StoredValueMatchesLookup(string? storedExportRecordId, string normalizedLookupKey) =>
        !string.IsNullOrWhiteSpace(storedExportRecordId)
        && string.Equals(
            storedExportRecordId.Trim(),
            normalizedLookupKey,
            StringComparison.OrdinalIgnoreCase);
}
