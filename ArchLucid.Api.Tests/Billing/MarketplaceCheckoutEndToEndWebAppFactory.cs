using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Api.Tests.Billing;

internal sealed class MarketplaceCheckoutEndToEndWebAppFactory : BillingCheckoutEndToEndSqlJwtFactoryBase
{
    protected override IReadOnlyDictionary<string, string?> GetBillingConfiguration()
    {
        return new Dictionary<string, string?>
        {
            ["Billing:Provider"] = BillingProviderNames.AzureMarketplace,
            ["Billing:AzureMarketplace:FulfillmentApiEnabled"] = "false",
            ["Billing:AzureMarketplace:GaEnabled"] = "true",
            ["Billing:AzureMarketplace:LandingPageUrl"] = "https://billing-test.invalid/landing",
            ["Billing:AzureMarketplace:OpenIdMetadataAddress"] =
                "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
            ["Billing:AzureMarketplace:ValidAudiences:0"] = "https://marketplaceapi.microsoft.com"
        };
    }

    protected override void ConfigureEndToEndServices(IServiceCollection services)
    {
        services.RemoveAll<IMarketplaceWebhookTokenVerifier>();
        services.AddSingleton<IMarketplaceWebhookTokenVerifier, AcceptAnyMarketplaceJwtVerifier>();
    }
}
