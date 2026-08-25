using ArchLucid.Core.Marketing;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.GoToMarket;
using ArchLucid.Persistence.Marketing;
using ArchLucid.Persistence.Telemetry;

namespace ArchLucid.Host.Composition.Configuration;

internal static class SqlMarketingRepositoryRegistrar
{
    public static void Register(IServiceCollection services)
    {
        services.AddScoped<IMarketingPricingQuoteRequestRepository, SqlMarketingPricingQuoteRequestRepository>();
        services.AddScoped<IMarketingPricingQuoteRequestAgingReader, SqlMarketingPricingQuoteRequestAgingReader>();
        services.AddScoped<IMarketingPricingQuoteRequestFollowUpRepository, SqlMarketingPricingQuoteRequestFollowUpRepository>();
        services.AddScoped<IMarketingEarlyAccessRequestRepository, SqlMarketingEarlyAccessRequestRepository>();
        services.AddScoped<ITenantMarketingAttributionRepository, SqlTenantMarketingAttributionRepository>();
        services.AddScoped<IFirstTenantFunnelEventStore, SqlFirstTenantFunnelEventStore>();
        services.AddScoped<IFirstTenantFunnelArchivalBatchStore, SqlFirstTenantFunnelArchivalBatchStore>();
    }
}
