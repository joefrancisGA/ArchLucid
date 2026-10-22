using ArchLucid.Application.Reporting;
using ArchLucid.Application.Templates;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup;

/// <summary>
/// Composition root for ArchLucid application services. Registration is split across partial files by subsystem
/// (scheduling, data plane, jobs, pipeline, coordinator, agents, decisioning) and capability facades (OP-05).
/// </summary>
public static partial class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers ArchLucid domain services, persistence choices, hosted workers, and health checks for the given host role.
    /// </summary>
    public static IServiceCollection AddArchLucidApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        RegisterHostedStartupProbes(services, configuration);
        RegisterProductLineRequestAccessor(services, configuration);
        services.AddSingleton(TimeProvider.System);
        services.AddPlatformCapability(configuration, hostingRole);
        services.AddAuthorityCapability(configuration, hostingRole);
        services.AddInfraEvidenceCapability(configuration, hostingRole);
        services.AddGovernanceCapability(configuration, hostingRole);

        return services;
    }
}
