namespace ArchLucid.Core.Budgeting;

/// <summary>
///     Durable per-tenant LLM budget state with optimistic concurrency (rowversion) and pre-call
///     <see cref="ReserveAsync" /> / post-call <see cref="SettleAsync" /> (INV-004).
/// </summary>
public interface ILlmTenantBudgetRepository
{
    Task<LlmTenantBudgetStateReadModel> GetOrCreateAsync(
        Guid tenantId,
        LlmBudgetPeriod period,
        string periodKey,
        CancellationToken cancellationToken = default);

    Task<LlmTenantBudgetReserveResult> ReserveAsync(
        LlmTenantBudgetReserveRequest request,
        CancellationToken cancellationToken = default);

    Task<LlmTenantBudgetSettleResult> SettleAsync(
        LlmTenantBudgetSettleRequest request,
        CancellationToken cancellationToken = default);
}
