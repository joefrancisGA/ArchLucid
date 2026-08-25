// Hosted-service composition registrations (extracted from ServiceCollectionExtensions.SchedulingAndAlerts).

using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Jobs;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Worker/Combined hosted-service registrations (archival, retention, extractor auto-pull, cache warmup).
/// </summary>
internal static class HostedServicesCompositionRegistrar
{
    public static void Register(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        RegisterDataArchivalHostedService(services, configuration, hostingRole);
        RegisterAgentResultBlobCleanupHostedService(services, hostingRole);
        RegisterSponsorRoiCacheWarmupHostedService(services, configuration, hostingRole);
        RegisterSponsorRoiSavingsGaugeHostedService(services, configuration, hostingRole);
        RegisterArchitectureProjectRetentionPurgeHostedService(services, hostingRole);
        RegisterSampleRunTtlHostedService(services, hostingRole);
        RegisterDraftIntakeReaperHostedService(services, hostingRole);
        RegisterWaiverExpiryNotificationHostedService(services, hostingRole);
        RegisterTenantErasureEligiblePurgeHostedService(services, hostingRole);
        RegisterOrphanedTenantCleanupHostedService(services, hostingRole);
        RegisterAzureExtractorAutoPullHostedService(services, hostingRole);
        RegisterAwsExtractorAutoPullHostedService(services, hostingRole);
        RegisterGcpExtractorAutoPullHostedService(services, hostingRole);
        RegisterWarmTenantCatalogReplenishHostedService(services, hostingRole);
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
