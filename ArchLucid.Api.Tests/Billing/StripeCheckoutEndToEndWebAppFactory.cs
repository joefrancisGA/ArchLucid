using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Billing;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace ArchLucid.Api.Tests.Billing;

internal sealed class StripeCheckoutEndToEndWebAppFactory : BillingCheckoutEndToEndSqlJwtFactoryBase
{
    protected override IReadOnlyDictionary<string, string?> GetBillingConfiguration()
    {
        return new Dictionary<string, string?>
        {
            ["Billing:Provider"] = BillingProviderNames.Stripe,
            ["Billing:Stripe:SecretKey"] = "sk_test_unused_no_network_checkout",
            ["Billing:Stripe:WebhookSigningSecret"] = StripeCheckoutE2EWebhookTestSigning.WebhookSigningSecret,
            ["Billing:Stripe:PriceIdTeam"] = "price_e2e_team_unused",
            ["Billing:Stripe:PriceIdPro"] = "price_e2e_pro_unused",
            ["Billing:Stripe:PriceIdEnterprise"] = "price_e2e_ent_unused"
        };
    }

    protected override void ConfigureEndToEndServices(IServiceCollection services)
    {
        services.AddScoped<StripeCheckoutNoNetworkBillingProvider>();
        services.RemoveAll<IBillingProviderRegistry>();
        services.AddScoped<IBillingProviderRegistry, StripeCheckoutE2EBillingProviderRegistry>();
    }
}
