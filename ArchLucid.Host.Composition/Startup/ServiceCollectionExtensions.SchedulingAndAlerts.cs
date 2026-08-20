using ArchLucid.Application.Advisory;
using ArchLucid.Application.Governance;
using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Http;
using ArchLucid.Decisioning.Advisory.Delivery;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Decisioning.Alerts;
using ArchLucid.Decisioning.Alerts.Composite;
using ArchLucid.Decisioning.Alerts.Delivery;
using ArchLucid.Notifications.Alerts;
using ArchLucid.Notifications.Advisory;
using ArchLucid.Decisioning.Alerts.Tuning;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Host.Composition.Alerts;
using ArchLucid.Host.Composition.Coordination.Cosmos;
using ArchLucid.Decisioning.Governance.Resolution;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Coordination.Cosmos;
using ArchLucid.Host.Core.Coordination.Export;
using ArchLucid.Host.Core.Coordination.Projection;
using ArchLucid.Host.Core.Coordination.Retrieval;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Http;
using ArchLucid.Host.Core.Integration;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Host.Core.Services;
using ArchLucid.Host.Core.Services.Delivery;
using ArchLucid.Integrations.AzureDevOps;
using ArchLucid.Notifications;
using ArchLucid.Persistence.Advisory;
using ArchLucid.Persistence.Alerts;
using ArchLucid.Persistence.Alerts.Simulation;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.IntegrationOutbox;
using ArchLucid.Persistence.Orchestration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Startup;

public static partial class ServiceCollectionExtensions
{
    private static void RegisterDataArchivalHostedService(
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

    private static void RegisterAgentResultBlobCleanupHostedService(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.DataArchival))
            services.AddHostedService<AgentResultBlobCleanupHostedService>();
    }

    private static void RegisterSponsorRoiCacheWarmupHostedService(
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

    private static void RegisterSponsorRoiSavingsGaugeHostedService(
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

    private static void RegisterArchitectureProjectRetentionPurgeHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        // Api-only hosts register ArchLucid.Api.Workers.RetentionPurgeWorker in Program (same lease + purge logic).

        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<ArchitectureProjectRetentionPurgeHostedService>();
    }

    private static void RegisterSampleRunTtlHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        // Api-only hosts register ArchLucid.Api.Workers.SampleRunTtlPurgeWorker in Program (same lease + purge logic).

        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<SampleRunTtlHostedService>();
    }

    private static void RegisterDraftIntakeReaperHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        // Api-only hosts register ArchLucid.Api.Workers.DraftIntakeReaperWorker in Program (same lease + purge logic).

        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<DraftIntakeReaperHostedService>();
    }

    private static void RegisterWaiverExpiryNotificationHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<WaiverExpiryNotificationHostedService>();
    }

    private static void RegisterTenantErasureEligiblePurgeHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        // Api-only hosts register ArchLucid.Api.Workers.TenantErasurePurgeWorker in Program (same lease + purge logic).

        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<TenantErasureEligiblePurgeHostedService>();
    }

    private static void RegisterOrphanedTenantCleanupHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<OrphanedTenantCleanupHostedService>();
    }

    private static void RegisterAzureExtractorAutoPullHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<AzureExtractorAutoPullHostedService>();
    }

    private static void RegisterAwsExtractorAutoPullHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<AwsExtractorAutoPullHostedService>();
    }

    private static void RegisterGcpExtractorAutoPullHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<GcpExtractorAutoPullHostedService>();
    }

    private static void RegisterWarmTenantCatalogReplenishHostedService(
        IServiceCollection services,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        services.AddHostedService<WarmTenantCatalogReplenishHostedService>();
    }

    private static void RegisterFirstTenantFunnelArchivalHostedService(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Combined and not ArchLucidHostingRole.Worker)
            return;

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.FirstTenantFunnelArchival))

            services.AddHostedService<FirstTenantFunnelArchivalHostedService>();

    }

    private static void RegisterRetrievalIndexingOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        services.AddSingleton<IRetrievalIndexingOutboxProcessor, RetrievalIndexingOutboxProcessor>();
        services.AddSingleton<IAuthorityPipelineWorkProcessor, AuthorityPipelineWorkProcessor>();

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        services.AddHostedService<RetrievalIndexingOutboxHostedService>();
        services.AddHostedService<AuthorityPipelineWorkHostedService>();
    }

    private static void RegisterRunExportBlobPushOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        services.AddSingleton<IRunExportBlobPushOutboxProcessor, RunExportBlobPushOutboxProcessor>();

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        services.AddHostedService<RunExportBlobPushOutboxHostedService>();
    }

    private static void RegisterPostCommitProjectionOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        services.AddSingleton<IPostCommitProjectionOutboxProcessor, PostCommitProjectionOutboxProcessor>();

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        services.AddHostedService<PostCommitProjectionOutboxHostedService>();
    }

    private static void RegisterCosmosGraphSnapshotOutbox(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        ArchLucidOptions archLucid = ArchLucidConfigurationBridge.ResolveArchLucidOptions(configuration);

        if (!ArchLucidOptions.EffectiveIsSql(archLucid.StorageProvider))
            return;

        // The processor resolves CosmosGraphSnapshotRepository (concrete) at runtime, which is only registered
        // when GraphSnapshotsEnabled=true. Skip registration entirely when the feature is off: there are no
        // Cosmos writes to drain, and running the hosted service would throw InvalidOperationException every
        // poll cycle.
        CosmosDbOptions cosmosOpts =
            configuration.GetSection(CosmosDbOptions.SectionName).Get<CosmosDbOptions>() ?? new CosmosDbOptions();

        if (!cosmosOpts.GraphSnapshotsEnabled)
            return;

        services.AddScoped<ICosmosGraphSnapshotOutboxSqlLoader, CosmosGraphSnapshotOutboxSqlLoader>();
        services.AddScoped<ICosmosGraphSnapshotOutboxCosmosWriter, CosmosGraphSnapshotOutboxCosmosWriter>();
        services.AddSingleton<ICosmosGraphSnapshotOutboxProcessor, CosmosGraphSnapshotOutboxProcessor>();

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        services.AddHostedService<CosmosGraphSnapshotOutboxHostedService>();
    }

    private static void RegisterIntegrationEventOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        services.AddSingleton<IIntegrationEventOutboxProcessor, IntegrationEventOutboxProcessor>();

        if (hostingRole is ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker)

            services.AddHostedService<IntegrationEventOutboxHostedService>();

        if (hostingRole is ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker)
            services.AddHostedService<IntegrationEventDlqRetryHostedService>();

    }

    private static void RegisterAzureDevOpsCommitStatusPublisher(
        IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<AzureDevOpsIntegrationOptions>(configuration.GetSection(AzureDevOpsIntegrationOptions.SectionName));
        services.AddHttpClient(
            AzureDevOpsCommitStatusPublisher.HttpClientName,
            static client => client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.DevOpsIntegration))
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration)
            .AddOutboundExternalHttpResilience();
        services.AddScoped<IAzureDevOpsCommitStatusPublisher, AzureDevOpsCommitStatusPublisher>();
    }

    private static void RegisterIntegrationEventConsumer(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not ArchLucidHostingRole.Worker)
            return;


        services.Configure<AzureDevOpsIntegrationOptions>(configuration.GetSection(AzureDevOpsIntegrationOptions.SectionName));
        services.AddHttpClient(
            AzureDevOpsPullRequestDecorator.HttpClientName,
            static client => client.Timeout = TimeSpan.FromSeconds(OutboundHttpClientTimeoutSeconds.DevOpsIntegration))
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration)
            .AddOutboundExternalHttpResilience();
        services.AddSingleton<IAzureDevOpsPullRequestDecoratorFactory, AzureDevOpsPullRequestDecoratorFactory>();
        services.AddSingleton<IIntegrationEventHandler, AuthorityRunCompletedAzureDevOpsIntegrationEventHandler>();
        services.AddSingleton<IIntegrationEventHandler, AuthorityRunCompletedChatOpsIntegrationEventHandler>();
        services.AddSingleton<IIntegrationEventHandler, TrialLifecycleEmailIntegrationEventHandler>();
        services.AddSingleton<IIntegrationEventHandler, LoggingIntegrationEventHandler>();

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.ServiceBusIntegrationEvents))

            services.AddHostedService<AzureServiceBusIntegrationEventConsumer>();

    }

    private static void RegisterAdvisoryScheduling(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        services.AddScoped<IScanScheduleCalculator, SimpleScanScheduleCalculator>();
        services.AddScoped<IArchitectureReviewRecurrenceNextRunCalculator, ArchitectureReviewRecurrenceNextRunCalculator>();
        services.AddScoped<IArchitectureDigestBuilder, ArchitectureDigestBuilder>();
        services.AddScoped<IAdvisoryScanRunner, AdvisoryScanRunner>();
        services.AddScoped<AdvisoryDueScheduleProcessor>();
        services
            .AddOptions<AdvisoryScanHostedServiceOptions>()
            .BindConfiguration(AdvisoryScanHostedServiceOptions.SectionName)
            .PostConfigure(static o =>
            {
                if (o.PollInterval <= TimeSpan.Zero)
                    o.PollInterval = TimeSpan.FromMinutes(5);
            });

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        if (!ArchLucidJobsOffload.IsOffloaded(configuration, ArchLucidJobNames.AdvisoryScan))

            services.AddHostedService<AdvisoryScanHostedService>();

        services.AddScoped<ArchitectureReviewRecurrenceDueScheduleProcessor>();
        services
            .AddOptions<ArchitectureReviewRecurrenceHostedServiceOptions>()
            .BindConfiguration(ArchitectureReviewRecurrenceHostedServiceOptions.SectionName)
            .PostConfigure(static o =>
            {
                if (o.PollInterval <= TimeSpan.Zero)
                    o.PollInterval = TimeSpan.FromMinutes(10);
            });

        if (hostingRole is ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker)
            services.AddHostedService<ArchitectureReviewRecurrenceHostedService>();

    }

    private static void RegisterDigestDelivery(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<WebhookDeliveryOptions>(configuration.GetSection(WebhookDeliveryOptions.SectionName));
        services.Configure<ChatOpsIncomingWebhooksOptions>(
            configuration.GetSection(ChatOpsIncomingWebhooksOptions.SectionName));
        services.AddSingleton<IEmailSender, FakeEmailSender>();
        services
            .AddHttpClient(
                HttpWebhookPoster.WebhookHttpClientName,
                static client => client.Timeout = TimeSpan.FromSeconds(60))
            .ConfigureArchLucidOutboundSocketsHandler(OutboundHttpSocketsHandlerProfile.ExternalIntegration)
            .AddOutboundExternalHttpResilience();
        services.AddSingleton<HttpWebhookPoster>();
        services.AddSingleton<FakeWebhookPoster>();
        services.AddSingleton<IWebhookPoster>(static sp =>
        {
            IOptionsMonitor<WebhookDeliveryOptions> monitor = sp.GetRequiredService<IOptionsMonitor<WebhookDeliveryOptions>>();
            IWebhookPoster inner = monitor.CurrentValue.UseHttpClient
                ? sp.GetRequiredService<HttpWebhookPoster>()
                : sp.GetRequiredService<FakeWebhookPoster>();

            IWebhookPoster withOptionalCloudEvents = new CloudEventsWrappingWebhookPoster(monitor, inner);

            return new WebhookHmacEnvelopePoster(monitor, withOptionalCloudEvents);
        });
        services.AddSingleton<IChatOpsWebhookDeliveryService, ChatOpsWebhookDeliveryService>();
        services.AddSingleton<IAuthorityRunCommittedChatOpsHook, AuthorityRunCommittedChatOpsHook>();
        services.AddSingleton<ISlackInteractivityVerifier, SlackInteractivityVerifier>();
        services.AddScoped<IDigestDeliveryChannel, DigestEmailDeliveryChannel>();
        services.AddScoped<IDigestDeliveryChannel, DigestTeamsWebhookDeliveryChannel>();
        services.AddScoped<IDigestDeliveryChannel, DigestSlackWebhookDeliveryChannel>();
        services.AddScoped<IDigestDeliveryDispatcher, DigestDeliveryDispatcher>();
    }

    private static void RegisterAlerts(IServiceCollection services)
    {
        services.AddScoped<ArchLucid.Core.Alerts.IAlertEvaluator, AlertEvaluator>();
        services.AddScoped<IAlertDeliveryChannel, AlertEmailDeliveryChannel>();
        services.AddScoped<IAlertDeliveryChannel, AlertTeamsWebhookDeliveryChannel>();
        services.AddScoped<IAlertDeliveryChannel, AlertSlackWebhookDeliveryChannel>();
        services.AddScoped<IAlertDeliveryChannel, AlertOnCallWebhookDeliveryChannel>();
        services.AddScoped<IAlertDeliveryDispatcher, AlertDeliveryDispatcher>();
        services.AddScoped<ArchLucid.Core.Alerts.IAlertService, AlertService>();
        services.AddScoped<ArchLucid.Decisioning.Alerts.IAlertService>(static sp =>
            new AlertServiceDecisioningPortAdapter(sp.GetRequiredService<ArchLucid.Core.Alerts.IAlertService>()));

        services.AddScoped<ArchLucid.Core.Alerts.Composite.IAlertMetricSnapshotBuilder, AlertMetricSnapshotBuilder>();
        services.AddScoped<ArchLucid.Core.Alerts.Composite.ICompositeAlertRuleEvaluator, CompositeAlertRuleEvaluator>();
        services.AddScoped<ArchLucid.Core.Alerts.Composite.IAlertSuppressionPolicy, AlertSuppressionPolicy>();
        services.AddScoped<ArchLucid.Core.Alerts.Composite.ICompositeAlertService, CompositeAlertService>();
        services.AddScoped<ArchLucid.Decisioning.Alerts.Composite.ICompositeAlertService>(static sp =>
            new CompositeAlertServiceDecisioningPortAdapter(sp.GetRequiredService<ArchLucid.Core.Alerts.Composite.ICompositeAlertService>()));

        services.AddScoped<ArchLucid.Core.Alerts.Simulation.IAlertSimulationContextProvider, AlertSimulationContextProvider>();
        services.AddScoped<ArchLucid.Core.Alerts.Simulation.IRuleSimulationService, RuleSimulationService>();
        services.AddScoped<ArchLucid.Decisioning.Alerts.Simulation.IRuleSimulationService>(static sp =>
            new RuleSimulationServiceDecisioningPortAdapter(sp.GetRequiredService<ArchLucid.Core.Alerts.Simulation.IRuleSimulationService>()));

        services.AddScoped<IAlertNoiseScorer, AlertNoiseScorer>();
        services.AddScoped<ArchLucid.Core.Alerts.Tuning.IThresholdRecommendationService, ThresholdRecommendationService>();
        services.AddScoped<IThresholdRecommendationService, ThresholdRecommendationService>();

        services.AddScoped<PolicyPackResolver>();
        services.AddScoped<CachingPolicyPackResolver>(static sp =>
            new CachingPolicyPackResolver(
                sp.GetRequiredService<PolicyPackResolver>(),
                sp.GetRequiredService<IHotPathReadCache>()));
        services.AddScoped<ArchLucid.Core.Governance.PolicyPacks.IPolicyPackResolver>(static sp =>
            sp.GetRequiredService<CachingPolicyPackResolver>());
        services.AddScoped<ArchLucid.Decisioning.Governance.PolicyPacks.IPolicyPackResolver>(static sp =>
            new CorePolicyPackResolverAdapter(sp.GetRequiredService<CachingPolicyPackResolver>()));
        services.AddScoped<IPolicyPackResolverCacheInvalidator, PolicyPackResolverCacheInvalidator>();
        services.AddScoped<IPolicyPackManagementService, PolicyPackManagementService>();
        services.AddScoped<ArchLucid.Core.Governance.Resolution.IEffectiveGovernanceResolver, EffectiveGovernanceResolver>();
        services.AddScoped<IEffectiveGovernanceResolver, EffectiveGovernanceResolver>();
        services.AddScoped<EffectiveGovernanceLoader>();
        services.AddScoped<ArchLucid.Core.Persistence.Ports.IEffectiveGovernanceLoader>(static sp =>
            new RequestScopedCachingEffectiveGovernanceLoader(sp.GetRequiredService<EffectiveGovernanceLoader>()));
        services.AddScoped<ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader>(static sp =>
            (ArchLucid.Decisioning.Governance.PolicyPacks.IEffectiveGovernanceLoader)sp.GetRequiredService<ArchLucid.Core.Persistence.Ports.IEffectiveGovernanceLoader>());
        services.AddScoped<IPolicyPacksAppService, PolicyPacksAppService>();
        services.AddScoped<IPolicyPackCatalogAdminService, PolicyPackCatalogAdminService>();
        services.AddScoped<IPlatformBundledPolicyPackAvailability, PlatformBundledPolicyPackAvailability>();
        services.AddScoped<PlatformBundledPolicyPackRegistryBootstrapper>();
        services.AddScoped<PolicyPackWorkspaceSelectionService>();
    }

    private static void RegisterIntegrationEventPublishing(IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<IntegrationEventsOptions>()
            .Bind(configuration.GetSection(IntegrationEventsOptions.SectionName))
            .ValidateOnStart();
        services.AddSingleton<IValidateOptions<IntegrationEventsOptions>, IntegrationEventsOptionsValidator>();

        services.AddSingleton<IIntegrationEventPublisher>(static sp =>
        {
            IntegrationEventsOptions options = sp.GetRequiredService<IOptions<IntegrationEventsOptions>>().Value;
            string? queueOrTopic = options.QueueOrTopicName?.Trim();
            string? fullyQualifiedNamespace = options.ServiceBusFullyQualifiedNamespace?.Trim();
            string? connectionString = options.ServiceBusConnectionString?.Trim();
            string? managedIdentityClientId = options.ServiceBusManagedIdentityClientId?.Trim();

            if (string.IsNullOrEmpty(queueOrTopic))
                return NullIntegrationEventPublisher.Instance;


            ILogger<AzureServiceBusIntegrationEventPublisher> logger =
                sp.GetRequiredService<ILogger<AzureServiceBusIntegrationEventPublisher>>();

            if (!string.IsNullOrEmpty(fullyQualifiedNamespace))

                return new AzureServiceBusIntegrationEventPublisher(
                    fullyQualifiedNamespace,
                    queueOrTopic,
                    string.IsNullOrEmpty(managedIdentityClientId) ? null : managedIdentityClientId,
                    logger);


            if (!string.IsNullOrEmpty(connectionString))
                return new AzureServiceBusIntegrationEventPublisher(connectionString, queueOrTopic, logger);


            return NullIntegrationEventPublisher.Instance;
        });
    }
}
