namespace ArchLucid.Core.QuickScan;

/// <summary>Hour/day bucket totals for Quick Scan global budget monitoring (TB-899).</summary>
public sealed class QuickScanGlobalBudgetBucketSnapshot
{
    public required string HourBucketKey { get; init; }

    public required string DayBucketKey { get; init; }

    public decimal HourReservedUsd { get; init; }

    public decimal HourCommittedUsd { get; init; }

    public decimal DayReservedUsd { get; init; }

    public decimal DayCommittedUsd { get; init; }

    public int PendingReservationCount { get; init; }

    public int ExpiredPendingReservationCount { get; init; }
}

/// <summary>Outcome of a reconciliation pass over expired budget reservations.</summary>
public sealed class QuickScanBudgetReconciliationResult
{
    public int ExpiredReservationCount { get; init; }

    public DateTimeOffset ReconciledUtc { get; init; }
}
