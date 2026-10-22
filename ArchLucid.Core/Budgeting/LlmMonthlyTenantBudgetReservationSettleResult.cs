namespace ArchLucid.Core.Budgeting;

/// <summary>Outcome of settling or releasing a monthly per-call reservation (TB-976).</summary>
public sealed class LlmMonthlyTenantBudgetReservationSettleResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public bool ConcurrencyConflict
    {
        get;
        init;
    }

    public bool ShouldEmitWarnAudit
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

    public static LlmMonthlyTenantBudgetReservationSettleResult NoOp() =>
        new() { Succeeded = true };

    public static LlmMonthlyTenantBudgetReservationSettleResult Completed(
        LlmTenantBudgetStateReadModel state,
        bool shouldEmitWarnAudit,
        bool periodKeyMismatch = false,
        string? authoritativePeriodKey = null) =>
        new()
        {
            Succeeded = true,
            NewState = state,
            ShouldEmitWarnAudit = shouldEmitWarnAudit,
            PeriodKeyMismatch = periodKeyMismatch,
            AuthoritativePeriodKey = authoritativePeriodKey
        };

    public static LlmMonthlyTenantBudgetReservationSettleResult Conflict() =>
        new() { ConcurrencyConflict = true };
}
