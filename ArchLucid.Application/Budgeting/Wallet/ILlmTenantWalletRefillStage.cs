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
}
