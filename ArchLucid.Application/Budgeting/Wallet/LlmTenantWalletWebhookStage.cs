using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Diagnostics;

namespace ArchLucid.Application.Budgeting.Wallet;

/// <inheritdoc cref="ILlmTenantWalletWebhookStage" />
public sealed class LlmTenantWalletWebhookStage(
    ILlmWalletSettlementQueue settlementQueue,
    ILlmTenantWalletRefillStage refillStage) : ILlmTenantWalletWebhookStage
{
    private readonly ILlmWalletSettlementQueue _settlementQueue =
        settlementQueue ?? throw new ArgumentNullException(nameof(settlementQueue));

    private readonly ILlmTenantWalletRefillStage _refillStage =
        refillStage ?? throw new ArgumentNullException(nameof(refillStage));

    public Task QueueOverageSettlementAsync(
        Guid tenantId,
        decimal actualUsd,
        Guid correlationId,
        decimal authorizedUsd = 0m,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (tenantId == Guid.Empty || actualUsd <= 0m)
            return Task.CompletedTask;

        _settlementQueue.EnqueueConsume(tenantId, actualUsd, correlationId, authorizedUsd);

        return Task.CompletedTask;
    }

    public async Task<bool> ApplyWebhookPaymentIntentSucceededAsync(
        Guid tenantId,
        string paymentIntentId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty || string.IsNullOrWhiteSpace(paymentIntentId) || amountUsd <= 0m)
            return false;

        LlmTenantWalletCreditResult credit = await _refillStage
            .CreditRefillWithRetryAsync(tenantId, amountUsd, correlationId, paymentIntentId, cancellationToken)
            .ConfigureAwait(false);

        if (!credit.Succeeded)
            return credit.DuplicatePaymentIntent;

        ArchLucidInstrumentation.RecordLlmWalletRefillUsd(amountUsd);
        ArchLucidInstrumentation.RecordLlmWalletBalanceUsd(tenantId, credit.BalanceAfterUsd);

        return true;
    }
}
