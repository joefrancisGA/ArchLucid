namespace ArchLucid.Core.Budgeting;

public sealed class RunScopedLlmBudgetAdmitResult
{
    private RunScopedLlmBudgetAdmitResult(
        bool allowed,
        bool reservationHeld,
        Guid? reservationId,
        decimal reservedUsd,
        RunScopedLlmBudgetAdmitRejectionReason? rejectionReason)
    {
        Allowed = allowed;
        ReservationHeld = reservationHeld;
        ReservationId = reservationId;
        ReservedUsd = reservedUsd;
        RejectionReason = rejectionReason;
    }

    public bool Allowed { get; }
    public bool ReservationHeld { get; }
    public Guid? ReservationId { get; }
    public decimal ReservedUsd { get; }
    public RunScopedLlmBudgetAdmitRejectionReason? RejectionReason { get; }

    public static RunScopedLlmBudgetAdmitResult PassThrough() =>
        new(true, false, null, 0m, null);

    public static RunScopedLlmBudgetAdmitResult Permit(Guid reservationId, decimal reservedUsd) =>
        new(true, true, reservationId, reservedUsd, null);

    public static RunScopedLlmBudgetAdmitResult Reject(RunScopedLlmBudgetAdmitRejectionReason reason) =>
        new(false, false, null, 0m, reason);
}
