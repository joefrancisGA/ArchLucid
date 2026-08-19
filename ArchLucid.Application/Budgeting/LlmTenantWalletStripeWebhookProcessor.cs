using System.Globalization;

using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.Budgeting;

public sealed class LlmTenantWalletStripeWebhookProcessor(ILlmTenantWalletService walletService) : ILlmTenantWalletStripeWebhookProcessor
{
    private readonly ILlmTenantWalletService _walletService =
        walletService ?? throw new ArgumentNullException(nameof(walletService));

    public async Task ProcessPaymentIntentEventAsync(
        string eventType,
        string paymentIntentId,
        string? tenantIdRaw,
        long amountCents,
        string? declineCode,
        Guid correlationId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(paymentIntentId))
            return;

        if (!Guid.TryParse(tenantIdRaw, out Guid tenantId) || tenantId == Guid.Empty)
            return;

        if (string.Equals(eventType, "payment_intent.succeeded", StringComparison.OrdinalIgnoreCase))
        {
            decimal amountUsd = decimal.Round(amountCents / 100m, 2, MidpointRounding.AwayFromZero);

            await _walletService
                .ApplyWebhookPaymentIntentSucceededAsync(tenantId, paymentIntentId, amountUsd, correlationId, cancellationToken)
                .ConfigureAwait(false);

            return;
        }

        if (string.Equals(eventType, "payment_intent.payment_failed", StringComparison.OrdinalIgnoreCase))
        {
            ArchLucid.Core.Diagnostics.ArchLucidInstrumentation.RecordLlmWalletRefillFailure(declineCode);
        }
    }
}
