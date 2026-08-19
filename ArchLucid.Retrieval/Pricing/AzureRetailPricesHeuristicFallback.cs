namespace ArchLucid.Retrieval.Pricing;

/// <summary>
///     Conservative monthly USD estimates when Azure Retail Prices returns no row (ROI fallback pricing).
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

        string normalizedSku = sku.Trim();
        string normalizedService = serviceName.Trim();

        if (TryGetAppServiceMonthlyUsd(normalizedService, normalizedSku, out monthlyUsd))
            return true;

        if (TryGetSqlMonthlyUsd(normalizedService, normalizedSku, out monthlyUsd))
            return true;

        if (TryGetRedisMonthlyUsd(normalizedService, normalizedSku, out monthlyUsd))
            return true;

        if (TryGetStorageMonthlyUsd(normalizedService, normalizedSku, out monthlyUsd))
            return true;

        if (MonthlyUsdBySku.TryGetValue(normalizedSku, out monthlyUsd))
            return true;

        if (TryGetComputeMonthlyUsd(normalizedSku, out monthlyUsd))
            return true;

        monthlyUsd = 0m;

        return false;
    }

    private static bool TryGetAppServiceMonthlyUsd(string serviceName, string sku, out decimal monthlyUsd)
    {
        if (!IsAppServiceRetailName(serviceName))
        {
            monthlyUsd = 0m;

            return false;
        }

        if (sku.StartsWith('S') && sku.Length == 2 && char.IsDigit(sku[1]))
        {
            monthlyUsd = sku[1] switch
            {
                '1' => 75m,
                '2' => 150m,
                '3' => 300m,
                _ => 75m,
            };

            return true;
        }

        if (sku.StartsWith("P1v", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 150m;

            return true;
        }

        if (sku.StartsWith("P2v", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 300m;

            return true;
        }

        monthlyUsd = 0m;

        return false;
    }

    private static bool TryGetSqlMonthlyUsd(string serviceName, string sku, out decimal monthlyUsd)
    {
        if (!IsSqlRetailName(serviceName))
        {
            monthlyUsd = 0m;

            return false;
        }

        if (sku.StartsWith("BC_Gen5_", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 300m;

            return true;
        }

        if (string.Equals(sku, "S0", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 15m;

            return true;
        }

        if (string.Equals(sku, "S1", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 50m;

            return true;
        }

        if (sku.StartsWith("GP_Gen5_", StringComparison.OrdinalIgnoreCase)
            || sku.StartsWith("HS_Gen5_", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 200m;

            return true;
        }

        monthlyUsd = 0m;

        return false;
    }

    private static bool TryGetRedisMonthlyUsd(string serviceName, string sku, out decimal monthlyUsd)
    {
        if (!IsRedisRetailName(serviceName))
        {
            monthlyUsd = 0m;

            return false;
        }

        if (string.Equals(sku, "C0", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 50m;

            return true;
        }

        if (string.Equals(sku, "C1", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 150m;

            return true;
        }

        if (string.Equals(sku, "P1", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 150m;

            return true;
        }

        if (sku.StartsWith('C') && sku.Length == 2 && char.IsDigit(sku[1]))
        {
            monthlyUsd = 50m + (sku[1] - '0') * 50m;

            return true;
        }

        monthlyUsd = 0m;

        return false;
    }

    private static bool TryGetStorageMonthlyUsd(string serviceName, string sku, out decimal monthlyUsd)
    {
        if (!IsStorageRetailName(serviceName))
        {
            monthlyUsd = 0m;

            return false;
        }

        if (sku.Contains("_LRS", StringComparison.OrdinalIgnoreCase)
            || sku.Contains("_ZRS", StringComparison.OrdinalIgnoreCase)
            || sku.Contains("_GRS", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 20m;

            return true;
        }

        monthlyUsd = 0m;

        return false;
    }

    private static bool TryGetComputeMonthlyUsd(string sku, out decimal monthlyUsd)
    {
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

    private static bool IsAppServiceRetailName(string serviceName) =>
        serviceName.Contains("App Service", StringComparison.OrdinalIgnoreCase);

    private static bool IsSqlRetailName(string serviceName) =>
        serviceName.Contains("SQL", StringComparison.OrdinalIgnoreCase);

    private static bool IsRedisRetailName(string serviceName) =>
        serviceName.Contains("Redis", StringComparison.OrdinalIgnoreCase);

    private static bool IsStorageRetailName(string serviceName) =>
        serviceName.Contains("Storage", StringComparison.OrdinalIgnoreCase);
}
