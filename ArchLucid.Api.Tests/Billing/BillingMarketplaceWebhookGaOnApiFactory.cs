namespace ArchLucid.Api.Tests.Billing;

internal sealed class BillingMarketplaceWebhookGaOnApiFactory : BillingMarketplaceWebhookApiFactoryBase
{
    protected override bool GaEnabled => true;
}
