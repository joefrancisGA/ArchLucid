using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterInternalCrossTenantAnalytics(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        services.Configure<InternalCrossTenantAnalyticsOptions>(
            configuration.GetSection(InternalCrossTenantAnalyticsOptions.SectionName));

        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
            return;

        services.AddHostedService<InternalCrossTenantRollupHostedService>();
    }
}
