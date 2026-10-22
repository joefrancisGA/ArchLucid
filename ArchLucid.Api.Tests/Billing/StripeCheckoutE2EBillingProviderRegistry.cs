using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Billing.AzureMarketplace;

using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests.Billing;

/// <summary>Test registry that routes Stripe checkout to <see cref="StripeCheckoutNoNetworkBillingProvider" />.</summary>
internal sealed class StripeCheckoutE2EBillingProviderRegistry(
    IOptionsMonitor<BillingOptions> billingOptions,
    NoopBillingProvider noop,
    StripeCheckoutNoNetworkBillingProvider stripeCheckoutNoNetwork,
    AzureMarketplaceBillingProvider azureMarketplace) : IBillingProviderRegistry
{
    private readonly AzureMarketplaceBillingProvider _azureMarketplace =
        azureMarketplace ?? throw new ArgumentNullException(nameof(azureMarketplace));

    private readonly IOptionsMonitor<BillingOptions> _billingOptions =
        billingOptions ?? throw new ArgumentNullException(nameof(billingOptions));

    private readonly NoopBillingProvider _noop = noop ?? throw new ArgumentNullException(nameof(noop));

    private readonly StripeCheckoutNoNetworkBillingProvider _stripeCheckoutNoNetwork =
        stripeCheckoutNoNetwork ?? throw new ArgumentNullException(nameof(stripeCheckoutNoNetwork));

    public IBillingProvider ResolveActiveProvider()
    {
        string name = _billingOptions.CurrentValue.Provider.Trim();

        if (string.Equals(name, BillingProviderNames.Stripe, StringComparison.OrdinalIgnoreCase))
        {
            return _stripeCheckoutNoNetwork;
        }

        if (string.Equals(name, BillingProviderNames.AzureMarketplace, StringComparison.OrdinalIgnoreCase))
        {
            return _azureMarketplace;
        }

        return _noop;
    }
}
