namespace ArchLucid.Core.QuickScan;

/// <summary>Stable Quick Scan concurrency/queue error codes for Problem Details (TB-896).</summary>
public static class QuickScanConcurrencyErrorCodes
{
    public const string Busy = "QUICK_SCAN_BUSY";

    public const string QueueFull = "QUICK_SCAN_QUEUE_FULL";

    public const string QueueTimeout = "QUICK_SCAN_QUEUE_TIMEOUT";
}
