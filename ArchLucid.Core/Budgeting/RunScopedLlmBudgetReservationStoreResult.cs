namespace ArchLucid.Core.Budgeting;

public sealed class RunScopedLlmBudgetReservationStoreResult
{
    private RunScopedLlmBudgetReservationStoreResult(
        bool allowed,
        Guid? reservationId,
        RunScopedLlmBudgetReservationStoreRejectionReason? rejectionReason)
    {
        Allowed = allowed;
        ReservationId = reservationId;
        RejectionReason = rejectionReason;
    }

    public bool Allowed { get; }
    public Guid? ReservationId { get; }
    public RunScopedLlmBudgetReservationStoreRejectionReason? RejectionReason { get; }

    public static RunScopedLlmBudgetReservationStoreResult Permit(Guid reservationId) =>
        new(true, reservationId, null);

    public static RunScopedLlmBudgetReservationStoreResult Reject(
        RunScopedLlmBudgetReservationStoreRejectionReason reason) =>
        new(false, null, reason);
}
