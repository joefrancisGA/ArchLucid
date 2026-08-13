namespace ArchLucid.Contracts.Architecture;

/// <summary>Admin Quick Scan global budget monitoring snapshot (TB-899).</summary>
public sealed class AdminQuickScanBudgetSnapshotResponse
{
    public required bool SafetyEnabled { get; init; }

    public required string OperationalMode { get; init; }

    public required decimal HourlyCeilingUsd { get; init; }

    public required decimal DailyCeilingUsd { get; init; }

    public required string HourBucketKey { get; init; }

    public required string DayBucketKey { get; init; }

    public required decimal HourReservedUsd { get; init; }

    public required decimal HourCommittedUsd { get; init; }

    public required decimal DayReservedUsd { get; init; }

    public required decimal DayCommittedUsd { get; init; }

    public required int PendingReservationCount { get; init; }

    public required int ExpiredPendingReservationCount { get; init; }

    public DateTimeOffset? LastReconciliationUtc { get; init; }

    public required int LastReconciliationExpiredCount { get; init; }

    public required IReadOnlyList<AdminQuickScanUsageRecordRow> RecentUsage { get; init; }
}

/// <summary>Privacy-minimized Quick Scan usage row for admin dashboard.</summary>
public sealed class AdminQuickScanUsageRecordRow
{
    public required DateTimeOffset OccurredUtc { get; init; }

    public required string Status { get; init; }

    public required string RouteKind { get; init; }

    public Guid? ReservationId { get; init; }

    public decimal? ReservedUsd { get; init; }

    public decimal? ActualCostUsd { get; init; }

    public int? InputTokens { get; init; }

    public int? OutputTokens { get; init; }

    public string? ModelLabel { get; init; }

    public string? RejectionReason { get; init; }

    public required int DurationMs { get; init; }
}
