namespace ArchLucid.Retrieval.Pricing;

/// <summary>Conservative monthly USD estimates when GCP Cloud Billing Catalog returns no row.</summary>
public static class GcpRetailPricesHeuristicFallback
{
    private static readonly Dictionary<string, decimal> MonthlyUsdByMachineType = new(StringComparer.OrdinalIgnoreCase)
    {
        ["n1-standard-1"] = 35m,
        ["n1-standard-2"] = 70m,
        ["n1-standard-4"] = 140m,
        ["e2-medium"] = 25m,
        ["e2-standard-2"] = 50m,
        ["c2-standard-4"] = 120m,
    };

    /// <summary>Attempts a conservative monthly USD estimate for a known Compute Engine machine type.</summary>
    public static bool TryGetMonthlyUsd(string serviceName, string machineType, out decimal monthlyUsd)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceName);
        ArgumentException.ThrowIfNullOrWhiteSpace(machineType);

        if (!serviceName.Contains("compute", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 0m;

            return false;
        }

        string normalized = machineType.Trim();

        if (MonthlyUsdByMachineType.TryGetValue(normalized, out monthlyUsd))
            return true;

        if (normalized.StartsWith("n1-standard-", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 70m;

            return true;
        }

        if (normalized.StartsWith("e2-", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 25m;

            return true;
        }

        monthlyUsd = 0m;

        return false;
    }
}
