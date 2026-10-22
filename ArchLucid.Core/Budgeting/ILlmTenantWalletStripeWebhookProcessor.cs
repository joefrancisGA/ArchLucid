namespace ArchLucid.Core.Budgeting;

/// <summary>Stripe webhook bridge for wallet refill events (implemented in Application).</summary>
public interface ILlmTenantWalletStripeWebhookProcessor
{
    Task ProcessPaymentIntentEventAsync(
        string eventType,
        string paymentIntentId,
        string? tenantIdRaw,
        long amountCents,
        string? declineCode,
        Guid correlationId,
        CancellationToken cancellationToken = default);
}
