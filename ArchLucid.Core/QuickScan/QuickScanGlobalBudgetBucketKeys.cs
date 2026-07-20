namespace ArchLucid.Core.QuickScan;

/// <summary>UTC bucket key helpers for Quick Scan global budget reservations (TB-894).</summary>
public static class QuickScanGlobalBudgetBucketKeys
{
    public static string BuildHourBucketKey(DateTimeOffset utcNow) =>
        utcNow.UtcDateTime.ToString("yyyyMMddHH", System.Globalization.CultureInfo.InvariantCulture);

    public static string BuildDayBucketKey(DateTimeOffset utcNow) =>
        utcNow.UtcDateTime.ToString("yyyyMMdd", System.Globalization.CultureInfo.InvariantCulture);

    public static decimal ApplyGrace(decimal ceilingUsd, decimal gracePercent)
    {
        if (ceilingUsd <= 0m)
        {
            return 0m;
        }

        return ceilingUsd * (1m + Math.Max(0m, gracePercent) / 100m);
    }
}
