namespace ArchLucid.Core.Budgeting;

/// <summary>Outcome of <see cref="ILlmTenantBudgetRepository.ReserveAsync" />.</summary>
public sealed class LlmTenantBudgetReserveResult
{
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

    /// <summary>True when per-tenant in-flight reservation admission was denied (TB-977).</summary>
    public bool AdmissionBlocked
    {
        get;
        init;
    }

    public LlmTenantBudgetStateReadModel? NewState
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

    /// <summary>Authoritative monthly period key used for the reserve mutation when <see cref="PeriodKeyMismatch" /> is true.</summary>
    public string? AuthoritativePeriodKey
    {
        get;
        init;
    }
}
