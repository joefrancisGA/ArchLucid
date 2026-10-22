using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;

namespace ArchLucid.Host.Composition.Startup.Modules;

internal static partial class HostedServicesCompositionRegistrar
{
    internal static void RegisterExtractorAutoPull(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        RegisterAzureExtractorAutoPullHostedService(services, hostingRole);
        RegisterAwsExtractorAutoPullHostedService(services, hostingRole);
        RegisterGcpExtractorAutoPullHostedService(services, hostingRole);
        RegisterWarmTenantCatalogReplenishHostedService(services, hostingRole);
    }

    internal static void RegisterAzureExtractorAutoPullHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<AzureExtractorAutoPullHostedService>();
    }

    internal static void RegisterAwsExtractorAutoPullHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<AwsExtractorAutoPullHostedService>();
    }

    internal static void RegisterGcpExtractorAutoPullHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<GcpExtractorAutoPullHostedService>();
    }

    internal static void RegisterWarmTenantCatalogReplenishHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<WarmTenantCatalogReplenishHostedService>();
    }
}
