using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Hosting;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterDataArchivalHostedService(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterDataArchivalHostedService(services, configuration, hostingRole);
    }

    private static void RegisterAgentResultBlobCleanupHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterAgentResultBlobCleanupHostedService(services, hostingRole);
    }

    private static void RegisterSponsorRoiCacheWarmupHostedService(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterSponsorRoiCacheWarmupHostedService(services, configuration, hostingRole);
    }

    private static void RegisterSponsorRoiSavingsGaugeHostedService(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterSponsorRoiSavingsGaugeHostedService(services, configuration, hostingRole);
    }

    private static void RegisterArchitectureProjectRetentionPurgeHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterArchitectureProjectRetentionPurgeHostedService(services, hostingRole);
    }

    private static void RegisterSampleRunTtlHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterSampleRunTtlHostedService(services, hostingRole);
    }

    private static void RegisterDraftIntakeReaperHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterDraftIntakeReaperHostedService(services, hostingRole);
    }

    private static void RegisterWaiverExpiryNotificationHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterWaiverExpiryNotificationHostedService(services, hostingRole);
    }

    private static void RegisterTenantErasureEligiblePurgeHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterTenantErasureEligiblePurgeHostedService(services, hostingRole);
    }

    private static void RegisterOrphanedTenantCleanupHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterOrphanedTenantCleanupHostedService(services, hostingRole);
    }

    private static void RegisterAzureExtractorAutoPullHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterAzureExtractorAutoPullHostedService(services, hostingRole);
    }

    private static void RegisterAwsExtractorAutoPullHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterAwsExtractorAutoPullHostedService(services, hostingRole);
    }

    private static void RegisterGcpExtractorAutoPullHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterGcpExtractorAutoPullHostedService(services, hostingRole);
    }

    private static void RegisterWarmTenantCatalogReplenishHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterWarmTenantCatalogReplenishHostedService(services, hostingRole);
    }

    private static void RegisterFirstTenantFunnelArchivalHostedService(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        HostedServicesCompositionRegistrar.RegisterFirstTenantFunnelArchivalHostedService(services, configuration, hostingRole);
    }

    private static void RegisterRetrievalIndexingOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        OutboxProcessorsCompositionRegistrar.RegisterRetrievalIndexingOutbox(services, hostingRole);
    }

    private static void RegisterRunExportBlobPushOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        OutboxProcessorsCompositionRegistrar.RegisterRunExportBlobPushOutbox(services, hostingRole);
    }

    private static void RegisterPostCommitProjectionOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        OutboxProcessorsCompositionRegistrar.RegisterPostCommitProjectionOutbox(services, hostingRole);
    }

    private static void RegisterCosmosGraphSnapshotOutbox(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        OutboxProcessorsCompositionRegistrar.RegisterCosmosGraphSnapshotOutbox(services, configuration, hostingRole);
    }

    private static void RegisterIntegrationEventOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        OutboxProcessorsCompositionRegistrar.RegisterIntegrationEventOutbox(services, hostingRole);
    }

    private static void RegisterAzureDevOpsCommitStatusPublisher(
        IServiceCollection services,
        IConfiguration configuration)
    {
        OutboxProcessorsCompositionRegistrar.RegisterAzureDevOpsCommitStatusPublisher(services, configuration);
    }

    private static void RegisterIntegrationEventConsumer(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        OutboxProcessorsCompositionRegistrar.RegisterIntegrationEventConsumer(services, configuration, hostingRole);
    }

    private static void RegisterAdvisoryScheduling(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        AdvisoryDigestSchedulingRegistrar.RegisterAdvisoryScheduling(services, configuration, hostingRole);
    }

    private static void RegisterDigestDelivery(IServiceCollection services, IConfiguration configuration)
    {
        AdvisoryDigestSchedulingRegistrar.RegisterDigestDelivery(services, configuration);
    }

    private static void RegisterIntegrationEventPublishing(IServiceCollection services, IConfiguration configuration)
    {
        OutboxProcessorsCompositionRegistrar.RegisterIntegrationEventPublishing(services, configuration);
    }
}
