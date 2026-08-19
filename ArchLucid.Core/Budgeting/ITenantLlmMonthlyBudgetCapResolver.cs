namespace ArchLucid.Core.Budgeting;

public interface ITenantLlmMonthlyBudgetCapResolver
{
    Task<decimal?> ResolveHardCapUsdAsync(Guid tenantId, CancellationToken cancellationToken = default);

    Task<bool> IsWalletOverageAllowedAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
