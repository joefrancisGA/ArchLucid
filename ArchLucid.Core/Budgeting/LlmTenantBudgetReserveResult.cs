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

    public LlmTenantBudgetStateReadModel? NewState
    {
        get;
        init;
    }
}
