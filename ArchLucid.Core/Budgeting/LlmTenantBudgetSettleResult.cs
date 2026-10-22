namespace ArchLucid.Core.Budgeting;

/// <summary>Outcome of <see cref="ILlmTenantBudgetRepository.SettleAsync" />.</summary>
public sealed class LlmTenantBudgetSettleResult
{
    public bool ConcurrencyConflict
    {
        get;
        init;
    }

    public LlmTenantBudgetStateReadModel? NewState
    {
        get;
        init;
    }

    public bool ShouldEmitWarnAudit
    {
        get;
        init;
    }

    /// <summary>
    ///     True when the caller's <c>PeriodKey</c> disagreed with the repository's authoritative UTC month (TB-977).
    /// </summary>
    public bool PeriodKeyMismatch
    {
        get;
        init;
    }

    /// <summary>Authoritative monthly period key at settle time when <see cref="PeriodKeyMismatch" /> is true.</summary>
    public string? AuthoritativePeriodKey
    {
        get;
        init;
    }
}
