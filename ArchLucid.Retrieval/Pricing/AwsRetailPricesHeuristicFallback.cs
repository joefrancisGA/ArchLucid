namespace ArchLucid.Retrieval.Pricing;

/// <summary>Conservative monthly USD estimates when AWS Price List returns no row.</summary>
public static class AwsRetailPricesHeuristicFallback
{
    private static readonly Dictionary<string, decimal> MonthlyUsdByInstanceType = new(StringComparer.OrdinalIgnoreCase)
    {
        ["m5.large"] = 70m,
        ["m5.xlarge"] = 140m,
        ["t3.micro"] = 8m,
        ["t3.small"] = 15m,
        ["t3.medium"] = 30m,
        ["c5.large"] = 62m,
        ["r5.large"] = 91m,
    };

    /// <summary>Attempts a conservative monthly USD estimate for a known EC2 instance type.</summary>
    public static bool TryGetMonthlyUsd(string serviceName, string instanceType, out decimal monthlyUsd)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceName);
        ArgumentException.ThrowIfNullOrWhiteSpace(instanceType);

        if (!serviceName.Contains("ec2", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 0m;

            return false;
        }

        string normalized = instanceType.Trim();

        if (MonthlyUsdByInstanceType.TryGetValue(normalized, out monthlyUsd))
            return true;

        if (normalized.StartsWith("m5.", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 70m;

            return true;
        }

        if (normalized.StartsWith("t3.", StringComparison.OrdinalIgnoreCase))
        {
            monthlyUsd = 15m;

            return true;
        }

        monthlyUsd = 0m;

        return false;
    }
}
