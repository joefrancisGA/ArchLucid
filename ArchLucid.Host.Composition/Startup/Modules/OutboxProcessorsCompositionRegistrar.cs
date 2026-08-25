// Outbox-processor composition registrations (extracted from ServiceCollectionExtensions.SchedulingAndAlerts).

using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Http;
using ArchLucid.Core.Integration;
using ArchLucid.Host.Composition.Coordination.Cosmos;
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
using ArchLucid.Integrations.AzureDevOps;
using ArchLucid.Notifications;
using ArchLucid.Persistence.Coordination.Export;
using ArchLucid.Persistence.Coordination.Projection;
using ArchLucid.Persistence.Coordination.Retrieval;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.IntegrationOutbox;

namespace ArchLucid.Host.Composition.Startup.Modules;

/// <summary>
///     Transactional outbox processors, integration-event publish/consume, and Azure DevOps commit-status publisher.
/// </summary>
internal static class OutboxProcessorsCompositionRegistrar
{
    public static void Register(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        RegisterRetrievalIndexingOutbox(services, hostingRole);
        RegisterRunExportBlobPushOutbox(services, hostingRole);
        RegisterPostCommitProjectionOutbox(services, hostingRole);
        RegisterCosmosGraphSnapshotOutbox(services, configuration, hostingRole);
        RegisterIntegrationEventOutbox(services, hostingRole);
        RegisterAzureDevOpsCommitStatusPublisher(services, configuration);
        RegisterIntegrationEventConsumer(services, configuration, hostingRole);
        RegisterIntegrationEventPublishing(services, configuration);
    }

    internal static void RegisterRetrievalIndexingOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        services.AddSingleton<IRetrievalIndexingOutboxProcessor, RetrievalIndexingOutboxProcessor>();
        services.AddSingleton<IAuthorityPipelineWorkProcessor, AuthorityPipelineWorkProcessor>();

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        services.AddHostedService<RetrievalIndexingOutboxHostedService>();
        services.AddHostedService<AuthorityPipelineWorkHostedService>();
    }

    internal static void RegisterRunExportBlobPushOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        services.AddSingleton<IRunExportBlobPushOutboxProcessor, RunExportBlobPushOutboxProcessor>();

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        services.AddHostedService<RunExportBlobPushOutboxHostedService>();
    }

    internal static void RegisterPostCommitProjectionOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        services.AddSingleton<IPostCommitProjectionOutboxProcessor, PostCommitProjectionOutboxProcessor>();

        if (hostingRole is not (ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker))
            return;

        services.AddHostedService<PostCommitProjectionOutboxHostedService>();
    }

    internal static void RegisterCosmosGraphSnapshotOutbox(
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

    internal static void RegisterIntegrationEventOutbox(IServiceCollection services, ArchLucidHostingRole hostingRole)
    {
        services.AddSingleton<IIntegrationEventOutboxProcessor, IntegrationEventOutboxProcessor>();

        if (hostingRole is ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker)

            services.AddHostedService<IntegrationEventOutboxHostedService>();

        if (hostingRole is ArchLucidHostingRole.Combined or ArchLucidHostingRole.Worker)
            services.AddHostedService<IntegrationEventDlqRetryHostedService>();

    }

    internal static void RegisterAzureDevOpsCommitStatusPublisher(
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

    internal static void RegisterIntegrationEventConsumer(
        IServiceCollection services,
        IConfiguration configuration,
        ArchLucidHostingRole hostingRole)
    {
        if (hostingRole is not (ArchLucidHostingRole.Worker or ArchLucidHostingRole.Combined))
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

    internal static void RegisterIntegrationEventPublishing(IServiceCollection services, IConfiguration configuration)
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
