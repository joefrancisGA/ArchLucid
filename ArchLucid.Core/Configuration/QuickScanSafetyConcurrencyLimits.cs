namespace ArchLucid.Core.Configuration;

/// <summary>Cluster-wide anonymous Quick Scan concurrency and queue bounds.</summary>
public sealed class QuickScanSafetyConcurrencyLimits
{
    public int MaxConcurrentAnonymousScans { get; set; } = 8;

    public int MaxQueuedAnonymousScans { get; set; } = 16;

    public int QueueWaitTimeoutSeconds { get; set; } = 30;
}
