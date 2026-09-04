using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Application.Runs.Async;
using ArchLucid.Application.Scim.Tokens;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.Metering;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Core.Health;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Integration;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Composition.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ContainerJobsOffloadRegistrationTests
{
    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_offloads_advisory_scan_does_not_register_AdvisoryScanHostedService()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.AdvisoryScan;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(AdvisoryScanHostedService));

        hasHosted.Should().BeFalse();
    }

    [Fact]
    public void AddArchLucidApplicationServices_Worker_default_registers_AdvisoryScanHostedService()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(AdvisoryScanHostedService));

        hasHosted.Should().BeTrue();
    }

    [Fact]
    public void AddArchLucidApplicationServices_Worker_registers_TenantHealthScoringHostedService()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(TenantHealthScoringHostedService));

        hasHosted.Should().BeTrue();
    }

    [Fact]
    public void AddArchLucidApplicationServices_registers_WeeklySponsorSummaryArchLucidJob()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasJob = services.Any(static d =>
            d.ServiceType == typeof(IArchLucidJob)
            && d.ImplementationType == typeof(WeeklySponsorSummaryArchLucidJob));

        hasJob.Should().BeTrue(
            "weekly-sponsor-summary must resolve via ArchLucidJobRunner when offloaded from the worker host");
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_offloads_weekly_sponsor_summary_does_not_register_WeeklySponsorSummaryHostedService()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.WeeklySponsorSummary;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(WeeklySponsorSummaryHostedService));

        hasHosted.Should().BeFalse();
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_offloads_data_archival_still_registers_AgentResultBlobCleanupHostedService()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.DataArchival;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(AgentResultBlobCleanupHostedService));

        hasHosted.Should().BeTrue(
            "agent trace blob cleanup is not a container job; offloading data-archival must not drop it from the worker");
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_offloads_orphan_probe_still_registers_OrphanProbeArchLucidJob()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.OrphanProbe;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasJob = services.Any(static d =>
            d.ServiceType == typeof(IArchLucidJob)
            && d.ImplementationType == typeof(OrphanProbeArchLucidJob));

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(DataConsistencyOrphanProbeHostedService));

        hasJob.Should().BeTrue(
            "orphan-probe must resolve via ArchLucidJobRunner when offloaded from the worker host");
        hasHosted.Should().BeFalse();
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_offloads_required_audit_trail_orphan_probe_still_registers_job()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.RequiredAuditTrailOrphanProbe;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasJob = services.Any(static d =>
            d.ServiceType == typeof(IArchLucidJob)
            && d.ImplementationType == typeof(RequiredAuditTrailOrphanProbeArchLucidJob));

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(RequiredAuditTrailOrphanProbeHostedService));

        hasJob.Should().BeTrue(
            "required-audit-trail-orphan-probe must resolve via ArchLucidJobRunner when offloaded from the worker host");
        hasHosted.Should().BeFalse();
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_offloads_audit_change_feed_with_cosmos_audit_registers_job_not_hosted_service()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.AuditChangeFeed;
        data["CosmosDb:AuditEventsEnabled"] = "true";
        data["CosmosDb:ConnectionString"] = "AccountEndpoint=https://unit-test.documents.azure.com:443/;AccountKey=dGVzdA==";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasJob = services.Any(static d =>
            d.ServiceType == typeof(IArchLucidJob)
            && d.ImplementationType == typeof(AuditEventChangeFeedArchLucidJob));

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(AuditEventChangeFeedHostedService));

        hasJob.Should().BeTrue(
            "audit-change-feed must resolve via ArchLucidJobRunner when offloaded from the worker host");
        hasHosted.Should().BeFalse();
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_logic_app_owner_mode_does_not_register_TrialLifecycleEmailScanHostedService()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data[TrialLifecycleEmailRoutingOptions.OwnerConfigurationKey] =
            TrialLifecycleEmailRoutingOptions.OwnerModes.LogicApp;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(TrialLifecycleEmailScanHostedService));

        hasHosted.Should().BeFalse(
            "Logic App ownership must skip the in-process trial lifecycle email scan hosted service");
    }

    [Fact]
    public void AddArchLucidApplicationServices_Api_role_does_not_register_TenantHealthScoringHostedService()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Hosting:Role"] = "Api";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(TenantHealthScoringHostedService));

        hasHosted.Should().BeFalse();
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_offloads_data_archival_does_not_register_DataArchivalHostHealthCheck()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.DataArchival;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        ServiceProvider provider = services.BuildServiceProvider();
        HealthCheckServiceOptions healthOptions =
            provider.GetRequiredService<IOptions<HealthCheckServiceOptions>>().Value;

        bool hasHealthCheck = healthOptions.Registrations.Any(static r => r.Name == "data_archival");

        hasHealthCheck.Should().BeFalse(
            "in-process data archival health must not run when archival is container-offloaded");
    }

    [Fact]
    public void AddArchLucidApplicationServices_Api_role_does_not_register_ScimTokenRotationReminderJob()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Hosting:Role"] = "Api";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(ScimTokenRotationReminderJob));

        hasHosted.Should().BeFalse();
    }

    [Fact]
    public void AddArchLucidApplicationServices_Combined_role_registers_ServiceBus_integration_event_consumer()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Hosting:Role"] = "Combined";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Combined);

        bool hasConsumer = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(AzureServiceBusIntegrationEventConsumer));

        hasConsumer.Should().BeTrue(
            "Combined hosts background services and must consume integration events like Worker when not container-offloaded");
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_offloads_servicebus_integration_events_registers_job_not_consumer()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.ServiceBusIntegrationEvents;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasJob = services.Any(static d =>
            d.ServiceType == typeof(IArchLucidJob)
            && d.ImplementationType == typeof(ServiceBusIntegrationEventsArchLucidJob));

        bool hasConsumer = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(AzureServiceBusIntegrationEventConsumer));

        hasJob.Should().BeTrue(
            "servicebus-integration-events must resolve via ArchLucidJobRunner when offloaded from the worker host");
        hasConsumer.Should().BeFalse();
    }

    [Fact]
    public void AddArchLucidApplicationServices_Api_role_does_not_register_ServiceBus_integration_event_consumer()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Hosting:Role"] = "Api";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        bool hasConsumer = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(AzureServiceBusIntegrationEventConsumer));

        hasConsumer.Should().BeFalse();
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Combined_durable_registers_BackgroundJobQueueProcessorHostedService()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Hosting:Role"] = "Combined";
        data["BackgroundJobs:Mode"] = "Durable";
        data["BackgroundJobs:QueueName"] = "background-jobs";
        data["ArtifactLargePayload:AzureBlobServiceUri"] = "https://account.blob.core.windows.net/";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Combined);

        bool hasProcessor = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(BackgroundJobQueueProcessorHostedService));

        hasProcessor.Should().BeTrue(
            "Combined hosts background work and must drain durable background jobs like Worker");
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Api_durable_does_not_register_BackgroundJobQueueProcessorHostedService()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Hosting:Role"] = "Api";
        data["BackgroundJobs:Mode"] = "Durable";
        data["BackgroundJobs:QueueName"] = "background-jobs";
        data["ArtifactLargePayload:AzureBlobServiceUri"] = "https://account.blob.core.windows.net/";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        bool hasProcessor = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(BackgroundJobQueueProcessorHostedService));

        hasProcessor.Should().BeFalse(
            "Api-only hosts enqueue durable jobs; Worker or Combined must process them");
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Api_role_registers_in_memory_async_operation_processors()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Hosting:Role"] = "Api";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        bool hasAdvisoryDraftProcessor = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(AdvisoryDraftOperationHostedService));

        bool hasRunAsyncProcessor = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(ArchitectureRunAsyncOperationHostedService));

        hasAdvisoryDraftProcessor.Should().BeTrue(
            "AdvisoryDraftOperationQueue is an in-process channel; the HTTP host that enqueues must drain its own queue");
        hasRunAsyncProcessor.Should().BeTrue(
            "ArchitectureRunAsyncOperationQueue is an in-process channel; async create/execute admits on Api must be processed locally");
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Api_durable_registers_stuck_running_watchdog_without_queue_processor()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Hosting:Role"] = "Api";
        data["BackgroundJobs:Mode"] = "Durable";
        data["BackgroundJobs:QueueName"] = "background-jobs";
        data["ArtifactLargePayload:AzureBlobServiceUri"] = "https://account.blob.core.windows.net/";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        bool hasWatchdog = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(BackgroundJobStuckRunningWatchdogHostedService));

        bool hasProcessor = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(BackgroundJobQueueProcessorHostedService));

        hasWatchdog.Should().BeTrue(
            "Api durable hosts enqueue jobs and the watchdog reclaims stale Running rows via SQL + queue notify for Worker drain");
        hasProcessor.Should().BeFalse(
            "Api-only hosts must not drain the durable queue locally");
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_offloads_first_tenant_funnel_archival_still_registers_job_not_hosted_service()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.FirstTenantFunnelArchival;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasJob = services.Any(static d =>
            d.ServiceType == typeof(IArchLucidJob)
            && d.ImplementationType == typeof(FirstTenantFunnelArchivalArchLucidJob));

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(FirstTenantFunnelArchivalHostedService));

        hasJob.Should().BeTrue(
            "first-tenant-funnel-archival must resolve via ArchLucidJobRunner when offloaded from the worker host");
        hasHosted.Should().BeFalse();
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_offloads_trial_lifecycle_still_registers_job_not_scheduler_hosted_service()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.TrialLifecycle;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasJob = services.Any(static d =>
            d.ServiceType == typeof(IArchLucidJob)
            && d.ImplementationType == typeof(TrialLifecycleArchLucidJob));

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(TrialLifecycleSchedulerHostedService));

        hasJob.Should().BeTrue(
            "trial-lifecycle must resolve via ArchLucidJobRunner when offloaded from the worker host");
        hasHosted.Should().BeFalse();
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_offloads_exec_digest_weekly_still_registers_job_not_hosted_service()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.ExecDigestWeekly;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasJob = services.Any(static d =>
            d.ServiceType == typeof(IArchLucidJob)
            && d.ImplementationType == typeof(ExecDigestWeeklyArchLucidJob));

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(ExecDigestWeeklyHostedService));

        hasJob.Should().BeTrue(
            "exec-digest-weekly must resolve via ArchLucidJobRunner when offloaded from the worker host");
        hasHosted.Should().BeFalse();
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Worker_offloads_weekly_architecture_digest_still_registers_job_not_hosted_service()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Jobs:OffloadedToContainerJobs:0"] = ArchLucidJobNames.WeeklyArchitectureDigest;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        bool hasJob = services.Any(static d =>
            d.ServiceType == typeof(IArchLucidJob)
            && d.ImplementationType == typeof(WeeklyArchitectureDigestArchLucidJob));

        bool hasHosted = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(WeeklyArchitectureDigestHostedService));

        hasJob.Should().BeTrue(
            "weekly-architecture-digest must resolve via ArchLucidJobRunner when offloaded from the worker host");
        hasHosted.Should().BeFalse();
    }

    [Fact]
    public void
        AddArchLucidApplicationServices_Api_role_registers_ApiRequestUsageEventBatchFlushHostedService()
    {
        Dictionary<string, string?> data = CreateWorkerCompositionDictionary();
        data["Hosting:Role"] = "Api";

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CreateCoreServices(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        bool hasFlush = services.Any(static d =>
            d.ServiceType == typeof(IHostedService)
            && d.ImplementationType == typeof(ApiRequestUsageEventBatchFlushHostedService));

        hasFlush.Should().BeTrue(
            "Api hosts record metering events via middleware and must drain the in-process buffer locally");
    }

    private static Dictionary<string, string?> CreateWorkerCompositionDictionary()
    {
        return new Dictionary<string, string?>
        {
            ["Hosting:Role"] = "Worker",
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ConnectionStrings:ArchLucid"] = InMemoryStartupSqlConnectionStringSentinel.Value,
            ["AgentExecution:Mode"] = "Simulator",
            ["AzureOpenAI:Endpoint"] = "",
            ["AzureOpenAI:ApiKey"] = "",
            ["AzureOpenAI:DeploymentName"] = "",
            ["AzureOpenAI:EmbeddingDeploymentName"] = "",
            ["FeatureManagement:FeatureFlags:AsyncAuthorityPipeline"] = "false",
            ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
            ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
            ["RateLimiting:Expensive:PermitLimit"] = "100000",
            ["RateLimiting:Expensive:WindowMinutes"] = "1",
            ["LlmCompletionCache:Enabled"] = "false",
            ["HotPathCache:Enabled"] = "false"
        };
    }

    private static ServiceCollection CreateCoreServices(IConfiguration configuration)
    {
        ServiceCollection services = [];
        services.AddSingleton(typeof(IConfiguration), configuration);
        services.AddSingleton<IHostEnvironment>(new CompositionTestHostEnvironment(Environments.Development));
        services.AddLogging(static b => b.AddDebug());
        services.AddSingleton<IScopeContextProvider, RegistrationTestScopeContextProvider>();

        return services;
    }

    private sealed class RegistrationTestScopeContextProvider : IScopeContextProvider
    {
        public ScopeContext GetCurrentScope()
        {
            return new ScopeContext
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
            };
        }
    }
}
