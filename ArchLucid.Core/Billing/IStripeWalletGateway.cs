namespace ArchLucid.Core.Billing;

/// <summary>Stripe PaymentIntent integration for LLM wallet auto-refill (TB-014).</summary>
public interface IStripeWalletGateway
{
    Task<StripeWalletChargeResult> ChargeRefillAsync(
        Guid tenantId,
        string stripeCustomerId,
        string stripePaymentMethodId,
        decimal amountUsd,
        Guid correlationId,
        CancellationToken cancellationToken = default);
}
