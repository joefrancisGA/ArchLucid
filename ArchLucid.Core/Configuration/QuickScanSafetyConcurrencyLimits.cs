namespace ArchLucid.Core.Configuration;

/// <summary>Cluster-wide anonymous Quick Scan concurrency and queue bounds.</summary>
public sealed class QuickScanSafetyConcurrencyLimits
{
    public int MaxConcurrentAnonymousScans { get; set; } = 8;

    public int MaxQueuedAnonymousScans { get; set; } = 16;

    public int QueueWaitTimeoutSeconds { get; set; } = 30;

    /// <summary>Active execution lease TTL; renewed while scan runs (TB-896).</summary>
    public int LeaseDurationSeconds { get; set; } = 120;

    /// <summary>How often in-flight scans renew their distributed lease (TB-896).</summary>
    public int LeaseRenewalIntervalSeconds { get; set; } = 30;
}
