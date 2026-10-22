namespace ArchLucid.Core.QuickScan;

/// <summary>Shared atomic store for anonymous Quick Scan hourly/daily spend reservations (TB-894).</summary>
public interface IQuickScanGlobalBudgetReservationStore
{
    Task<QuickScanGlobalBudgetReservationStoreResult> TryReserveAsync(
        QuickScanGlobalBudgetReservationRequest request,
        CancellationToken cancellationToken = default);

    Task CommitAsync(
        Guid reservationId,
        decimal actualUsd,
        CancellationToken cancellationToken = default);

    Task ReleaseAsync(Guid reservationId, CancellationToken cancellationToken = default);

    Task<QuickScanGlobalBudgetBucketSnapshot> GetBucketSnapshotAsync(
        DateTimeOffset utcNow,
        CancellationToken cancellationToken = default);

    Task<QuickScanBudgetReconciliationResult> ReconcileExpiredReservationsAsync(
        DateTimeOffset utcNow,
        CancellationToken cancellationToken = default);
}

/// <summary>Input for a single global budget reservation attempt.</summary>
public sealed class QuickScanGlobalBudgetReservationRequest
{
    public required Guid ReservationId { get; init; }

    public required string IdempotencyKey { get; init; }

    public required DateTimeOffset UtcNow { get; init; }

    public required decimal ReserveUsd { get; init; }

    public required decimal MaxHourUsd { get; init; }

    public required decimal MaxDayUsd { get; init; }

    public required decimal AccountingGracePercent { get; init; }

    public required TimeSpan ReservationTtl { get; init; }
}

/// <summary>Store-level reservation outcome.</summary>
public sealed class QuickScanGlobalBudgetReservationStoreResult
{
    private QuickScanGlobalBudgetReservationStoreResult(
        bool allowed,
        Guid? reservationId,
        QuickScanGlobalBudgetReservationStoreRejectionReason? rejectionReason)
    {
        Allowed = allowed;
        ReservationId = reservationId;
        RejectionReason = rejectionReason;
    }

    public bool Allowed { get; }

    public Guid? ReservationId { get; }

    public QuickScanGlobalBudgetReservationStoreRejectionReason? RejectionReason { get; }

    public static QuickScanGlobalBudgetReservationStoreResult Permit(Guid reservationId) =>
        new(true, reservationId, null);

    public static QuickScanGlobalBudgetReservationStoreResult Reject(
        QuickScanGlobalBudgetReservationStoreRejectionReason reason) =>
        new(false, null, reason);
}

/// <summary>Store rejection reasons (mapped to user-safe capacity responses in the service layer).</summary>
public enum QuickScanGlobalBudgetReservationStoreRejectionReason
{
    HourlyCeilingExceeded,
    DailyCeilingExceeded,
    StoreUnavailable,
}
