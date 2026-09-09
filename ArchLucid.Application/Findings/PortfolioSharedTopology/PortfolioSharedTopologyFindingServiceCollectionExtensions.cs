using ArchLucid.Application.Findings.PortfolioSharedTopology;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Application.Findings;

public static class PortfolioSharedTopologyFindingServiceCollectionExtensions
{
    public static IServiceCollection AddPortfolioSharedTopologyFindingEngine(this IServiceCollection services)
    {
        services.AddScoped<ISharedTopologyMatcher, SharedTopologyMatcher>();
        services.AddScoped<IPortfolioSharedTopologyFindingEmitter, PortfolioSharedTopologyFindingEmitter>();

        return services;
    }
}
