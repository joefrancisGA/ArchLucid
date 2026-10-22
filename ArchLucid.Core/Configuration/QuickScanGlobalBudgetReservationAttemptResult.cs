namespace ArchLucid.Core.Configuration;

/// <summary>Outcome of a global budget reservation attempt.</summary>
public sealed class QuickScanGlobalBudgetReservationAttemptResult
{
    private QuickScanGlobalBudgetReservationAttemptResult(
        bool allowed,
        Guid? reservationId,
        QuickScanGlobalBudgetReservationRejectionReason? rejectionReason)
    {
        Allowed = allowed;
        ReservationId = reservationId;
        RejectionReason = rejectionReason;
    }

    public bool Allowed { get; }

    public Guid? ReservationId { get; }

    public QuickScanGlobalBudgetReservationRejectionReason? RejectionReason { get; }

    public static QuickScanGlobalBudgetReservationAttemptResult Permit(Guid reservationId) =>
        new(true, reservationId, null);

    public static QuickScanGlobalBudgetReservationAttemptResult Reject(
        QuickScanGlobalBudgetReservationRejectionReason reason) =>
        new(false, null, reason);
}
