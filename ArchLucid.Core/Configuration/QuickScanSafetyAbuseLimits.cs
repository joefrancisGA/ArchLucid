namespace ArchLucid.Core.Configuration;

/// <summary>Duplicate and burst abuse detection thresholds for anonymous Quick Scan.</summary>
public sealed class QuickScanSafetyAbuseLimits
{
    public int DuplicateDetectionWindowSeconds { get; set; } = 300;

    public int BurstRequestsPerMinuteThreshold { get; set; } = 10;

    public int BurstRequestsPerFiveMinutesThreshold { get; set; } = 25;
}
