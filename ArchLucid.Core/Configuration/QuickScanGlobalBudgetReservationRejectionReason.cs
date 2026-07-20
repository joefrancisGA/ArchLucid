namespace ArchLucid.Core.Configuration;

/// <summary>Why a Quick Scan global budget reservation was rejected.</summary>
public enum QuickScanGlobalBudgetReservationRejectionReason
{
    Disabled,
    EmergencyDisabled,
    StoreUnavailable,
    HourlyCeilingExceeded,
    DailyCeilingExceeded,
}
