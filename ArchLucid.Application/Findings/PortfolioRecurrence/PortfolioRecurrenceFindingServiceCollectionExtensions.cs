using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.Findings.PortfolioRecurrence;

public static class PortfolioRecurrenceFindingServiceCollectionExtensions
{
    public static IServiceCollection AddPortfolioRecurrenceFindingEngine(this IServiceCollection services)
    {
        services.AddScoped<IPortfolioRunScanSource, PortfolioRunScanSource>();
        services.AddScoped<IRecurrenceIdentityMatcher, RecurrenceIdentityMatcher>();
        services.AddScoped<IPortfolioRecurrenceFindingEmitter, PortfolioRecurrenceFindingEmitter>();
        return services;
    }
}
