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
}
