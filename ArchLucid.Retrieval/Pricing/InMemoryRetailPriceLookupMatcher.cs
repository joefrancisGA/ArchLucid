namespace ArchLucid.Retrieval.Pricing;

/// <summary>Shared row-matching logic for in-memory cloud retail price lookups.</summary>
internal static class InMemoryRetailPriceLookupMatcher
{
    public static bool TryMatch<TRow>(
        IReadOnlyList<TRow> rows,
        string serviceName,
        string region,
        string? optionalSku,
        Func<TRow, string> getServiceName,
        Func<TRow, string> getRegion,
        Func<TRow, string> getSku,
        out TRow row)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceName);
        ArgumentException.ThrowIfNullOrWhiteSpace(region);

        foreach (TRow candidate in rows)
        {
            if (!getServiceName(candidate).Equals(serviceName, StringComparison.OrdinalIgnoreCase))
                continue;

            if (!getRegion(candidate).Equals(region, StringComparison.OrdinalIgnoreCase))
                continue;

            if (!string.IsNullOrWhiteSpace(optionalSku)
                && !getSku(candidate).Equals(optionalSku, StringComparison.OrdinalIgnoreCase))
                continue;

            row = candidate;
            return true;
        }

        row = default!;
        return false;
    }
}
