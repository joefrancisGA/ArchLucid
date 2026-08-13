namespace ArchLucid.Application.Findings;

/// <summary>
///     Blocks inventory-driven findings when the scoped extractor ZIP collection timestamp is stale.
/// </summary>
public static class InventoryCollectionFreshnessGate
{
    public static bool ShouldSuppressInventoryFindings(
        DateTime? collectionTimestampUtc,
        DateTime utcNow,
        int staleAfterDays)
    {
        if (collectionTimestampUtc is null)
            return true;

        int thresholdDays = staleAfterDays <= 0 ? 90 : staleAfterDays;
        DateTime normalizedUtc = collectionTimestampUtc.Value.Kind == DateTimeKind.Utc
            ? collectionTimestampUtc.Value
            : collectionTimestampUtc.Value.ToUniversalTime();
        double ageDays = (utcNow - normalizedUtc).TotalDays;

        return ageDays > thresholdDays;
    }
}
