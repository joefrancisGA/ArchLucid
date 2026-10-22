namespace ArchLucid.Core.Budgeting;

/// <summary>Outcome of a monthly per-call reservation attempt (TB-976).</summary>
public sealed class LlmMonthlyTenantBudgetReservationStoreResult
{
    public bool Allowed
    {
        get;
        init;
    }

    public Guid? ReservationId
    {
        get;
        init;
    }

    public bool ConcurrencyConflict
    {
        get;
        init;
    }

    public bool HardCapBlocked
    {
        get;
        init;
    }

    public bool PeriodKeyMismatch
    {
        get;
        init;
    }

    public string? AuthoritativePeriodKey
    {
        get;
        init;
    }

    public LlmTenantBudgetStateReadModel? NewState
    {
        get;
        init;
    }

    public static LlmMonthlyTenantBudgetReservationStoreResult Permit(
        Guid reservationId,
        LlmTenantBudgetStateReadModel state,
        bool periodKeyMismatch = false,
        string? authoritativePeriodKey = null) =>
        new()
        {
            Allowed = true,
            ReservationId = reservationId,
            NewState = state,
            PeriodKeyMismatch = periodKeyMismatch,
            AuthoritativePeriodKey = authoritativePeriodKey
        };

    public static LlmMonthlyTenantBudgetReservationStoreResult RejectHardCap(LlmTenantBudgetStateReadModel? state) =>
        new() { HardCapBlocked = true, NewState = state };

    public static LlmMonthlyTenantBudgetReservationStoreResult RejectConcurrency() =>
        new() { ConcurrencyConflict = true };
}
