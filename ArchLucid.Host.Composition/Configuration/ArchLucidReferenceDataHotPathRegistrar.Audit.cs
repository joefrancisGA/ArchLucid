using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Coordination.Caching;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Configuration;

partial class ArchLucidReferenceDataHotPathRegistrar
{
    public static void RegisterAuditRepository(IServiceCollection services, IConfiguration configuration)
    {
        HotPathCacheOptions hotPath = configuration
                                          .GetSection(HotPathCacheOptions.SectionName)
                                          .Get<HotPathCacheOptions>()
                                      ?? new HotPathCacheOptions();

        if (!hotPath.Enabled)
        {
            services.AddScoped<IAuditRepository, DapperAuditRepository>();
            return;
        }

        services.AddScoped<DapperAuditRepository>();
        services.AddScoped<IAuditRepository>(sp => new CachingAuditRepository(
            sp.GetRequiredService<DapperAuditRepository>(),
            sp.GetRequiredService<IHotPathReadCache>()));
    }
}
