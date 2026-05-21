using ArchLucid.Application.Billing;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Http;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Billing.AzureMarketplace;
using ArchLucid.Persistence.Billing.Stripe;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    internal static void RegisterBilling(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<BillingOptions>(configuration.GetSection(BillingOptions.SectionName));
        services.Configure<BillingUnitRatesOptions>(configuration.GetSection(BillingUnitRatesOptions.SectionPath));
        services.AddScoped<ITenantCostEstimateService, TenantCostEstimateService>();
        services.AddHttpClient(
            nameof(AzureMarketplaceBillingProvider),
            static client => client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.ExternalIntegration));
        services.AddScoped<BillingWebhookTrialActivator>();
        services.AddScoped<StripeBillingProvider>();
        services.AddScoped<NoopBillingProvider>();
        services.AddScoped<IMarketplaceChangePlanWebhookMutationHandler, MarketplaceChangePlanWebhookMutationHandler>();
        services.AddScoped<IMarketplaceChangeQuantityWebhookMutationHandler, MarketplaceChangeQuantityWebhookMutationHandler>();
        services.AddScoped<AzureMarketplaceBillingProvider>();
        services.AddScoped<IMarketplaceWebhookTokenVerifier, MicrosoftMarketplaceJwtVerifier>();
        services.AddScoped<IBillingProviderRegistry, BillingProviderRegistry>();
        services.AddScoped<IBillingTrialConversionGate, BillingTrialConversionGate>();
    }
}
