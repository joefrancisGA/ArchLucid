using System.Globalization;

using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

using Stripe;
using Stripe.Checkout;

namespace ArchLucid.Persistence.Billing.Stripe;

public sealed class StripeLinkedCustomerResolver(
    IBillingLedger ledger,
    IOptionsMonitor<BillingOptions> billingOptions) : IStripeLinkedCustomerResolver
{
    private readonly IBillingLedger _ledger = ledger ?? throw new ArgumentNullException(nameof(ledger));

    private readonly IOptionsMonitor<BillingOptions> _billingOptions =
        billingOptions ?? throw new ArgumentNullException(nameof(billingOptions));

    public async Task<string?> TryResolveLinkedCustomerIdAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        string? secretKey = _billingOptions.CurrentValue.Stripe.SecretKey?.Trim();

        if (string.IsNullOrWhiteSpace(secretKey))
            return null;

        string? providerRef = await _ledger.TryGetProviderSubscriptionIdAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(providerRef))
            return null;

        try
        {
            return await TryResolveCustomerFromProviderRefAsync(
                tenantId,
                providerRef.Trim(),
                secretKey,
                cancellationToken).ConfigureAwait(false);
        }
        catch (StripeException)
        {
            return null;
        }
    }

    internal static async Task<string?> TryResolveCustomerFromProviderRefAsync(
        Guid tenantId,
        string providerRef,
        string secretKey,
        CancellationToken cancellationToken)
    {
        RequestOptions requestOptions = new()
        {
            ApiKey = secretKey,
        };

        if (providerRef.StartsWith("sub_", StringComparison.Ordinal))
        {
            SubscriptionService subscriptionService = new();
            Subscription subscription = await subscriptionService.GetAsync(
                providerRef,
                requestOptions: requestOptions,
                cancellationToken: cancellationToken).ConfigureAwait(false);

            if (!MetadataMatchesTenant(subscription.Metadata, tenantId))
                return null;

            return subscription.CustomerId;
        }

        if (!providerRef.StartsWith("cs_", StringComparison.Ordinal))
            return null;

        SessionService sessionService = new();
        Session checkoutSession = await sessionService.GetAsync(
            providerRef,
            requestOptions: requestOptions,
            cancellationToken: cancellationToken).ConfigureAwait(false);

        if (!MetadataMatchesTenant(checkoutSession.Metadata, tenantId))
            return null;

        if (!string.IsNullOrWhiteSpace(checkoutSession.CustomerId))
            return checkoutSession.CustomerId;

        if (string.IsNullOrWhiteSpace(checkoutSession.SubscriptionId))
            return null;

        SubscriptionService subscriptionServiceFromSession = new();
        Subscription subscriptionFromSession = await subscriptionServiceFromSession.GetAsync(
            checkoutSession.SubscriptionId,
            requestOptions: requestOptions,
            cancellationToken: cancellationToken).ConfigureAwait(false);

        if (!MetadataMatchesTenant(subscriptionFromSession.Metadata, tenantId))
            return null;

        return subscriptionFromSession.CustomerId;
    }

    private static bool MetadataMatchesTenant(IReadOnlyDictionary<string, string>? metadata, Guid tenantId)
    {
        if (metadata is null)
            return false;

        if (!metadata.TryGetValue("tenant_id", out string? raw) || string.IsNullOrWhiteSpace(raw))
            return false;

        return Guid.TryParse(raw.Trim(), out Guid parsedTenantId) && parsedTenantId == tenantId;
    }
}
