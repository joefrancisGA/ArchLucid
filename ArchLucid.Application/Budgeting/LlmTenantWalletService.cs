using ArchLucid.Application.Budgeting.Wallet;
using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.Budgeting;

public sealed class LlmTenantWalletService(
    ILlmTenantWalletConsumeStage consumeStage,
    ILlmTenantWalletRefillStage refillStage,
    ILlmTenantWalletWebhookStage webhookStage) : ILlmTenantWalletService
{
    private readonly ILlmTenantWalletConsumeStage _consumeStage =
        consumeStage ?? throw new ArgumentNullException(nameof(consumeStage));

    private readonly ILlmTenantWalletRefillStage _refillStage =
        refillStage ?? throw new ArgumentNullException(nameof(refillStage));

    private readonly ILlmTenantWalletWebhookStage _webhookStage =
        webhookStage ?? throw new ArgumentNullException(nameof(webhookStage));

    public async Task<LlmTenantWalletView> GetWalletAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        LlmTenantWalletStateReadModel state = await _consumeStage.GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);

        return MapView(state);
    }

    public async Task<LlmTenantWalletView?> UpdateWalletAsync(
        Guid tenantId,
        LlmTenantWalletUpdateCommand command,
        CancellationToken cancellationToken = default)
    {
        LlmTenantWalletStateReadModel? updated = await _consumeStage
            .UpdateWalletAsync(tenantId, command, cancellationToken)
            .ConfigureAwait(false);

        return updated is null ? null : MapView(updated);
    }

    public Task<bool> TryAuthorizeOverageSpendAsync(
        Guid tenantId,
        decimal estimatedUsd,
        CancellationToken cancellationToken = default) =>
        _consumeStage.TryAuthorizeOverageSpendAsync(tenantId, estimatedUsd, cancellationToken);

    public Task QueueOverageSettlementAsync(
        Guid tenantId,
        decimal actualUsd,
        Guid correlationId,
        decimal authorizedUsd = 0m,
        CancellationToken cancellationToken = default) =>
        _webhookStage.QueueOverageSettlementAsync(tenantId, actualUsd, correlationId, authorizedUsd, cancellationToken);

    public Task<bool> TryAutoRefillAsync(Guid tenantId, Guid correlationId, CancellationToken cancellationToken = default) =>
        _refillStage.TryAutoRefillAsync(tenantId, correlationId, cancellationToken);

    public Task<bool> ApplyWebhookPaymentIntentSucceededAsync(
        Guid tenantId,
        string paymentIntentId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken = default) =>
        _webhookStage.ApplyWebhookPaymentIntentSucceededAsync(
            tenantId,
            paymentIntentId,
            amountUsd,
            correlationId,
            cancellationToken);

    internal Task ConsumeInternalAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken) =>
        _consumeStage.ConsumeInternalAsync(tenantId, amountUsd, correlationId, cancellationToken);

    internal Task ReconcileOverageInternalAsync(
        Guid tenantId,
        decimal actualUsd,
        decimal authorizedUsd,
        Guid correlationId,
        CancellationToken cancellationToken) =>
        _consumeStage.ReconcileOverageInternalAsync(tenantId, actualUsd, authorizedUsd, correlationId, cancellationToken);

    private static LlmTenantWalletView MapView(LlmTenantWalletStateReadModel state) =>
        new()
        {
            BalanceUsd = state.BalanceUsd,
            AutoReplenishEnabled = state.AutoReplenishEnabled,
            MonthlyCapUsd = state.MonthlyCapUsd,
            RefillIncrementUsd = state.RefillIncrementUsd,
            RefillTriggerThresholdUsd = state.RefillTriggerThresholdUsd,
            AutoRefillsThisUtcMonthCount = state.AutoRefillsThisUtcMonthCount,
            LastRefillUtc = state.LastRefillUtc,
            HasPaymentMethod = !string.IsNullOrWhiteSpace(state.StripePaymentMethodId),
            RowVersion = state.RowVersion,
        };
}
