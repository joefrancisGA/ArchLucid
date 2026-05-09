namespace ArchLucid.Persistence.Data.Repositories.LlmDailyTenantTokenWindow;

/// <summary>Durable UTC-day token totals for per-tenant LLM budgets.</summary>
public interface ILlmDailyTenantTokenWindowStateRepository
{
    Task<LlmDailyTenantTokenWindowStateReadModel> GetOrCreateAsync(
        Guid tenantId,
        DateOnly utcDay,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Adds <paramref name="addTokens" /> when positive. Warn-flag semantics match monthly USD tracker.
    ///     A conflict is indicated when <paramref name="expectedRowVersion" /> is stale or the row is missing.
    /// </summary>
    Task<LlmDailyTenantTokenWindowTokensUpdateResult> TryIncrementTokensAsync(
        Guid tenantId,
        DateOnly utcDay,
        long addTokens,
        long warnAtTokens,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default);
}
