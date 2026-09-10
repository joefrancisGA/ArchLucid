using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.Budgeting.Wallet;

public interface ILlmTenantWalletRefillStage
{
    Task<bool> TryAutoRefillAsync(Guid tenantId, Guid correlationId, CancellationToken cancellationToken = default);

    Task<LlmTenantWalletCreditResult> CreditRefillWithRetryAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        string paymentIntentId,
        CancellationToken cancellationToken);

    /// <summary>
    ///     Auto-refill count for the current UTC month; prior-month rows display as zero until the next refill writes.
    /// </summary>
    int VisibleAutoRefillsThisUtcMonth(LlmTenantWalletStateReadModel state);
}
