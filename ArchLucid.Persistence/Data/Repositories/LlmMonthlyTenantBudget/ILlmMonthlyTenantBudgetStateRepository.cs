namespace ArchLucid.Persistence.Data.Repositories.LlmMonthlyTenantBudget;

/// <summary>Persistent UTC-month estimated USD bucket per tenant (replaces in-process-only totals).</summary>
public interface ILlmMonthlyTenantBudgetStateRepository
{
    /// <summary>Loads or inserts the zero row for <paramref name="tenantId" /> / UTC month.</summary>
    Task<LlmMonthlyTenantBudgetStateReadModel> GetOrCreateAsync(
        Guid tenantId,
        int utcYear,
        int utcMonth,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Increments <c>SpentUsd</c> when <c>RowVersion</c> matches; sets <c>WarnedApproaching</c> when crossing
    ///     <paramref name="warnAtUsd" />. Returns <see cref="LlmMonthlyTenantBudgetSpendUpdateResult.ConcurrencyConflict" />
    ///     when no row was updated (caller retries from <see cref="GetOrCreateAsync" />).
    /// </summary>
    Task<LlmMonthlyTenantBudgetSpendUpdateResult> TryIncrementSpendAsync(
        Guid tenantId,
        int utcYear,
        int utcMonth,
        decimal addUsd,
        decimal warnAtUsd,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default);
}
