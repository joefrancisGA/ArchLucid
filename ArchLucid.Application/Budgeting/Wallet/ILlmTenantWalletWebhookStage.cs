namespace ArchLucid.Application.Budgeting.Wallet;

public interface ILlmTenantWalletWebhookStage
{
    Task QueueOverageSettlementAsync(
        Guid tenantId,
        decimal actualUsd,
        Guid correlationId,
        decimal authorizedUsd = 0m,
        CancellationToken cancellationToken = default);

    Task<bool> ApplyWebhookPaymentIntentSucceededAsync(
        Guid tenantId,
        string paymentIntentId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken = default);
}
