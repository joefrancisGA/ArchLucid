namespace ArchLucid.Persistence.Data.Repositories;

internal static class ComparisonRecordIdLookup
{
    internal static string NormalizeLookupKey(string comparisonRecordId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(comparisonRecordId);
        return comparisonRecordId.Trim();
    }

    internal static bool StoredValueMatchesLookup(string? storedComparisonRecordId, string normalizedLookupKey) =>
        !string.IsNullOrWhiteSpace(storedComparisonRecordId)
        && string.Equals(
            storedComparisonRecordId.Trim(),
            normalizedLookupKey,
            StringComparison.OrdinalIgnoreCase);

    internal static string TiebreakerSortKey(string comparisonRecordId) => comparisonRecordId.Trim();
}
