using ArchLucid.Core.Alerts;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

partial class ArchLucidReferenceDataHotPathRegistrar
{
    private static void RegisterAlertsReferenceDataHotPathRepositories(
        IServiceCollection services,
        HotPathCacheOptions hotPath)
    {
        if (!hotPath.Enabled)
        {
            services.AddScoped<IAlertRuleRepository, DapperAlertRuleRepository>();
            services.AddScoped<ICompositeAlertRuleRepository, DapperCompositeAlertRuleRepository>();
            return;
        }

        services.AddScoped<DapperAlertRuleRepository>();
        services.AddScoped<IAlertRuleRepository>(static sp => new CachingAlertRuleRepository(
            sp.GetRequiredService<DapperAlertRuleRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));

        services.AddScoped<DapperCompositeAlertRuleRepository>();
        services.AddScoped<ICompositeAlertRuleRepository>(static sp => new CachingCompositeAlertRuleRepository(
            sp.GetRequiredService<DapperCompositeAlertRuleRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));
    }
}
