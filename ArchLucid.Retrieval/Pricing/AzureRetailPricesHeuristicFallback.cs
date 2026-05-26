namespace ArchLucid.Retrieval.Pricing;

/// <summary>
///     Heuristic monthly USD estimates when Azure Retail Prices returns no row (Improvement #6).
/// </summary>
public static class AzureRetailPricesHeuristicFallback
{
    private static readonly Dictionary<string, decimal> MonthlyUsdBySku = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Standard_D2s_v5"] = 70m,
        ["Standard_D4s_v5"] = 140m,
        ["Standard_D8s_v5"] = 280m,
        ["Standard_E2s_v5"] = 95m,
        ["Standard_E4s_v5"] = 190m,
        ["Standard_B2s"] = 35m,
        ["Standard_B4ms"] = 120m,
        ["P10"] = 20m,
        ["P20"] = 40m,
        ["P30"] = 80m,
    };

    /// <summary>Attempts a conservative monthly USD estimate for a known SKU pattern.</summary>
    public static bool TryGetMonthlyUsd(string serviceName, string sku, out decimal monthlyUsd)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceName);
        ArgumentException.ThrowIfNullOrWhiteSpace(sku);

        if (MonthlyUsdBySku.TryGetValue(sku.Trim(), out monthlyUsd))
            return true;

        if (sku.StartsWith("Standard_D", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 70m;
            return true;
        }

        if (sku.StartsWith("Standard_E", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 95m;
            return true;
        }

        if (sku.StartsWith('P') && sku.Length >= 2 && char.IsDigit(sku[1]))
        {
            monthlyUsd = 25m;
            return true;
        }

        monthlyUsd = 0m;
        return false;
    }
}
