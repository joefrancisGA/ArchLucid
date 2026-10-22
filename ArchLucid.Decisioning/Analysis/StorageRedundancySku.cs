namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Azure storage redundancy SKUs. LRS and ZRS keep copies in one region.
///     GRS, RAGRS, GZRS, and RAGZRS copy data to a paired region.
///     The declaration parser lowercases azurerm values and may prefix <c>Standard_</c> or <c>Premium_</c>.
/// </summary>
internal static class StorageRedundancySku
{
    public static bool IsSingleRegion(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        string normalized = Normalize(value);

        return normalized is "lrs" or "zrs"
            or "standardlrs" or "standardzrs"
            or "premiumlrs" or "premiumzrs";
    }

    private static string Normalize(string value)
    {
        return value.Trim()
            .ToLowerInvariant()
            .Replace("_", string.Empty, StringComparison.Ordinal)
            .Replace("-", string.Empty, StringComparison.Ordinal)
            .Replace(" ", string.Empty, StringComparison.Ordinal);
    }
}
