namespace ArchLucid.Api.Tests.Billing;

internal sealed class BillingMarketplaceWebhookDeferredApiFactory : BillingMarketplaceWebhookApiFactoryBase
{
    protected override bool GaEnabled => false;
}
