using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.Budgeting;

public interface ILlmTenantWalletService
{
    Task<LlmTenantWalletView> GetWalletAsync(Guid tenantId, CancellationToken cancellationToken = default);

    Task<LlmTenantWalletView?> UpdateWalletAsync(
        Guid tenantId,
        LlmTenantWalletUpdateCommand command,
        CancellationToken cancellationToken = default);

    Task<bool> TryAuthorizeOverageSpendAsync(
        Guid tenantId,
        decimal estimatedUsd,
        CancellationToken cancellationToken = default);

    Task QueueOverageSettlementAsync(
        Guid tenantId,
        decimal actualUsd,
        Guid correlationId,
        CancellationToken cancellationToken = default);

    Task<bool> TryAutoRefillAsync(Guid tenantId, Guid correlationId, CancellationToken cancellationToken = default);

    Task<bool> ApplyWebhookPaymentIntentSucceededAsync(
        Guid tenantId,
        string paymentIntentId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken = default);
}
