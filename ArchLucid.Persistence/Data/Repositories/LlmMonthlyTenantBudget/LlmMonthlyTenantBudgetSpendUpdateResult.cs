namespace ArchLucid.Persistence.Data.Repositories.LlmMonthlyTenantBudget;

/// <summary>Outcome of a spend increment against <see cref="ILlmMonthlyTenantBudgetStateRepository" />.</summary>
public sealed class LlmMonthlyTenantBudgetSpendUpdateResult
{
    public bool ConcurrencyConflict { get; init; }

    public LlmMonthlyTenantBudgetStateReadModel? NewState { get; init; }

    /// <summary>True when this writer crossed the warn threshold (emit audit once per month bucket).</summary>
    public bool ShouldEmitWarnAudit { get; init; }
}
