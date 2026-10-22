namespace ArchLucid.Core.Configuration;

/// <summary>Global anonymous Quick Scan request count ceilings.</summary>
public sealed class QuickScanSafetyGlobalRequestLimits
{
    public int MaxAnonymousRequestsPerHour { get; set; } = 120;

    public int MaxAnonymousRequestsPerDay { get; set; } = 500;
}
