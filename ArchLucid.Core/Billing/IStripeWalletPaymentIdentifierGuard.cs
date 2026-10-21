namespace ArchLucid.Core.Billing;

/// <summary>Validates wallet PUT Stripe identifiers belong to the tenant before auto-refill can charge them.</summary>
public interface IStripeWalletPaymentIdentifierGuard
{
    Task<bool> AllowsWalletUpdateAsync(
        Guid tenantId,
        string? stripeCustomerId,
        string? stripePaymentMethodId,
        CancellationToken cancellationToken = default);
}
