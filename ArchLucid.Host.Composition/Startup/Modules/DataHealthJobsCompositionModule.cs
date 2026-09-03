using ArchLucid.Core.Hosting;
using ArchLucid.Host.Core.Hosting;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>Health checks, data consistency reconciliation, and background jobs DI registrations.</summary>
public static partial class DataHealthJobsCompositionModule
{
    /// <summary>Registers health checks, reconciliation hosted services, and background job infrastructure.</summary>
    public static void Register(IServiceCollection services, IConfiguration configuration, ArchLucidHostingRole hostingRole)
    {
        RegisterArchLucidHealthChecks(services, configuration, hostingRole);
        RegisterDataConsistencyReconciliation(services, configuration, hostingRole);
        RegisterBackgroundJobs(services, configuration, hostingRole);
    }
}
