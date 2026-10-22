namespace ArchLucid.Core.Configuration;

/// <summary>Lifecycle state for a Quick Scan global budget reservation (TB-894).</summary>
public enum QuickScanGlobalBudgetReservationStatus
{
    Pending = 0,
    Committed = 1,
    Released = 2,
    Expired = 3,
}
