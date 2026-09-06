using ArchLucid.Application.Governance;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>Compliance drift escalation scanner DI and worker hosted-service registrations.</summary>
public static class ComplianceDriftEscalationCompositionModule
{
    /// <summary>Registers compliance drift escalation services for the given host role.</summary>
    public static void Register(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        services.Configure<ComplianceDriftEscalationOptions>(
            configuration.GetSection(ComplianceDriftEscalationOptions.SectionName));
        services.AddScoped<ComplianceDriftEscalationScanner>();

        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
            return;

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.ComplianceDriftEscalation))
            services.AddHostedService<ComplianceDriftEscalationHostedService>();
    }
}
