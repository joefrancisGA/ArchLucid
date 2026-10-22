// Trial lifecycle email, scheduler, and architecture preseed composition registrations.

using ArchLucid.Application;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Host.Core.Notifications.Email;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Trial lifecycle email publishing, scheduler, and architecture preseed DI registrations.
/// </summary>
public static class TrialLifecycleCompositionModule
{
    /// <summary>
    ///     Registers trial lifecycle audit/email, scheduler, and preseed services for the given host role.
    /// </summary>
    public static void Register(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        RegisterTrialLifecycleAuditEmailPublishing(services);
        RegisterTrialLifecycleEmailHostedServices(services, configuration, hostingRole);
        RegisterTrialLifecycleScheduler(services, configuration, hostingRole);
        RegisterTrialArchitecturePreseed(services, configuration, hostingRole);
    }

    private static void RegisterTrialLifecycleAuditEmailPublishing(IServiceCollection services)
    {
        services.AddScoped<AuditService>();
        services.AddScoped<IAuditService, TrialLifecycleEmailPublishingAuditDecorator>();
    }

    private static void RegisterTrialLifecycleEmailHostedServices(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
            return;

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.TrialEmailScan)
            && !TrialLifecycleEmailRoutingOptions.IsLogicAppOwnerMode(
                configuration[TrialLifecycleEmailRoutingOptions.OwnerConfigurationKey]))
            services.AddHostedService<TrialLifecycleEmailScanHostedService>();
    }

    private static void RegisterTrialLifecycleScheduler(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
            return;

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.TrialLifecycle))
            services.AddHostedService<TrialLifecycleSchedulerHostedService>();
    }

    private static void RegisterTrialArchitecturePreseed(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
            return;

        services.Configure<TrialArchitecturePreseedOptions>(
            configuration.GetSection(TrialArchitecturePreseedOptions.SectionName));
        services.AddScoped<TrialArchitecturePreseedExecutor>();

        TrialArchitecturePreseedOptions snapshot =
            configuration.GetSection(TrialArchitecturePreseedOptions.SectionName).Get<TrialArchitecturePreseedOptions>()
            ?? new TrialArchitecturePreseedOptions();

        if (snapshot.Enabled)
            services.AddHostedService<TrialArchitecturePreseedHostedService>();
    }
}
