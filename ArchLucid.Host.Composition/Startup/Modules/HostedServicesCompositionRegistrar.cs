// Hosted-service composition registrations (extracted from ServiceCollectionExtensions.SchedulingAndAlerts).

using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Worker/Combined hosted-service registrations (archival, retention, extractor auto-pull, cache warmup).
/// </summary>
internal static partial class HostedServicesCompositionRegistrar
{
    public static void Register(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        RegisterArchivalRetention(services, configuration, hostingRole);
        RegisterSponsorRoi(services, configuration, hostingRole);
        RegisterExtractorAutoPull(services, hostingRole);
    }
}
