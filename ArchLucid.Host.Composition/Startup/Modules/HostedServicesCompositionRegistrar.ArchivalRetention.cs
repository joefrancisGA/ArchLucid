using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;

namespace ArchLucid.Host.Composition.Startup.Modules;

internal static partial class HostedServicesCompositionRegistrar
{
    internal static void RegisterArchivalRetention(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        RegisterDataArchivalHostedService(services, configuration, hostingRole);
        RegisterAgentResultBlobCleanupHostedService(services, hostingRole);
        RegisterArchitectureProjectRetentionPurgeHostedService(services, hostingRole);
        RegisterSampleRunTtlHostedService(services, hostingRole);
        RegisterDraftIntakeReaperHostedService(services, hostingRole);
        RegisterWaiverExpiryNotificationHostedService(services, hostingRole);
        RegisterTenantErasureEligiblePurgeHostedService(services, hostingRole);
        RegisterOrphanedTenantCleanupHostedService(services, hostingRole);
        RegisterFirstTenantFunnelArchivalHostedService(services, configuration, hostingRole);
    }

    internal static void RegisterDataArchivalHostedService(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        // DataArchivalHostedService / DataArchivalHostHealthCheck on Worker+Combined. Api does not run the in-process
        // archival loop but still composes IArchLucidJob implementations — DI must resolve this singleton.
        services.AddSingleton<DataArchivalHostHealthState>();

        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;


        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.DataArchival))

            services.AddHostedService<DataArchivalHostedService>();

    }

    internal static void RegisterAgentResultBlobCleanupHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        // Agent trace blob cleanup is worker-only and has no container-job offload slug.
        services.AddHostedService<AgentResultBlobCleanupHostedService>();
    }

    internal static void RegisterArchitectureProjectRetentionPurgeHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        // Api-only hosts register ArchLucid.Api.Workers.RetentionPurgeWorker in Program (same lease + purge logic).

        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<ArchitectureProjectRetentionPurgeHostedService>();
    }

    internal static void RegisterSampleRunTtlHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        // Api-only hosts register ArchLucid.Api.Workers.SampleRunTtlPurgeWorker in Program (same lease + purge logic).

        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<SampleRunTtlHostedService>();
    }

    internal static void RegisterDraftIntakeReaperHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        // Api-only hosts register ArchLucid.Api.Workers.DraftIntakeReaperWorker in Program (same lease + purge logic).

        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<DraftIntakeReaperHostedService>();
    }

    internal static void RegisterWaiverExpiryNotificationHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<WaiverExpiryNotificationHostedService>();
    }

    internal static void RegisterTenantErasureEligiblePurgeHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        // Api-only hosts register ArchLucid.Api.Workers.TenantErasurePurgeWorker in Program (same lease + purge logic).

        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<TenantErasureEligiblePurgeHostedService>();
    }

    internal static void RegisterOrphanedTenantCleanupHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<OrphanedTenantCleanupHostedService>();
    }

    internal static void RegisterFirstTenantFunnelArchivalHostedService(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.FirstTenantFunnelArchival))

            services.AddHostedService<FirstTenantFunnelArchivalHostedService>();

    }
}
