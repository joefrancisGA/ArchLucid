using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;

namespace ArchLucid.Host.Composition.Startup.Modules;

internal static partial class HostedServicesCompositionRegistrar
{
    internal static void RegisterSponsorRoi(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        RegisterSponsorRoiCacheWarmupHostedService(services, configuration, hostingRole);
        RegisterSponsorRoiSavingsGaugeHostedService(services, configuration, hostingRole);
    }

    internal static void RegisterSponsorRoiCacheWarmupHostedService(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        SponsorRoiCacheWarmupOptions opts =
            configuration.GetSection(SponsorRoiCacheWarmupOptions.SectionPath).Get<SponsorRoiCacheWarmupOptions>()
            ?? new SponsorRoiCacheWarmupOptions();

        if (!opts.Enabled)
            return;

        services.AddHostedService<SponsorRoiCacheWarmupHostedService>();
    }

    internal static void RegisterSponsorRoiSavingsGaugeHostedService(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        SponsorRoiSavingsGaugeOptions opts =
            configuration.GetSection(SponsorRoiSavingsGaugeOptions.SectionPath).Get<SponsorRoiSavingsGaugeOptions>()
            ?? new SponsorRoiSavingsGaugeOptions();

        if (!opts.Enabled)
            return;

        services.AddHostedService<SponsorRoiSavingsGaugeHostedService>();
    }
}
