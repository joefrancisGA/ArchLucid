namespace ArchLucid.Application.Architecture;

/// <summary>User-safe concurrency/queue rejection reasons for anonymous Quick Scan (TB-896).</summary>
public enum QuickScanConcurrencyRejectionReason
{
    Busy,
    QueueFull,
    QueueTimeout,
    StoreUnavailable,
    EmergencyDisabled,
}
