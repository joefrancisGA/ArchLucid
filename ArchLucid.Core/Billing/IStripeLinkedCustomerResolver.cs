namespace ArchLucid.Core.Billing;

/// <summary>Resolves the Stripe customer id linked to a tenant via billing ledger checkout/subscription refs.</summary>
public interface IStripeLinkedCustomerResolver
{
    Task<string?> TryResolveLinkedCustomerIdAsync(Guid tenantId, CancellationToken cancellationToken = default);
}
