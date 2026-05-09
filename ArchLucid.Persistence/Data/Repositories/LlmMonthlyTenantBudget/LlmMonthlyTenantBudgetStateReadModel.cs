namespace ArchLucid.Persistence.Data.Repositories.LlmMonthlyTenantBudget;

/// <summary>Materialized row for <c>dbo.LlmMonthlyTenantBudgetState</c> (UTC calendar month bucket).</summary>
public sealed class LlmMonthlyTenantBudgetStateReadModel
{
    public decimal SpentUsd { get; init; }

    public bool WarnedApproaching { get; init; }

    /// <summary>SQL Server <c>rowversion</c> for optimistic concurrency.</summary>
    public byte[] RowVersion { get; init; } = [];
}
