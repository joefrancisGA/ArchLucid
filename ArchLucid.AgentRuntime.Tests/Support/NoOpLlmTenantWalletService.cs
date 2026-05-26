namespace ArchLucid.AgentRuntime.Tests.Support;

using ArchLucid.Application.Budgeting;
using ArchLucid.Core.Budgeting;

internal sealed class NoOpLlmTenantWalletService : ILlmTenantWalletService
{
    public Task<LlmTenantWalletView> GetWalletAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(
            new LlmTenantWalletView
            {
                BalanceUsd = 0m,
                RefillIncrementUsd = LlmTenantWalletDefaults.RefillIncrementUsd,
                RefillTriggerThresholdUsd = LlmTenantWalletDefaults.RefillTriggerThresholdUsd,
            });
    }

    public Task<LlmTenantWalletView?> UpdateWalletAsync(
        Guid tenantId,
        LlmTenantWalletUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult<LlmTenantWalletView?>(null);
    }

    public Task<bool> TryAuthorizeOverageSpendAsync(
        Guid tenantId,
        decimal estimatedUsd,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(false);
    }

    public Task QueueOverageSettlementAsync(
        Guid tenantId,
        decimal actualUsd,
        Guid correlationId,
        CancellationToken cancellationToken = default)
    {
        return Task.CompletedTask;
    }

    public Task<bool> TryAutoRefillAsync(Guid tenantId, Guid correlationId, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(false);
    }

    public Task<bool> ApplyWebhookPaymentIntentSucceededAsync(
        Guid tenantId,
        string paymentIntentId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(false);
    }
}
