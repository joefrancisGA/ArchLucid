using System.Reflection;

using ArchLucid.AgentRuntime;
using ArchLucid.Application;
using ArchLucid.Application.AwsExtractor;
using ArchLucid.Application.AzureExtractor;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.GcpExtractor;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Application.Roi;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.WeeklyArchitectureDigest;
using ArchLucid.Application.WeeklySponsorReport;
using ArchLucid.Application.WeeklySponsorSummary;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Alerts;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Composition.Startup.Modules.Agents;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Host.Core.Notifications.Email;
using ArchLucid.Persistence.Coordination.Retrieval;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Composition.Tests.Startup;

/// <summary>
///     Pins host-composition refactors #10, #39, and #42: agent, pipeline, and alerts bounded-context modules
///     plus scheduling/outbox and pipeline registrars own their DI registrations instead of mega
///     <see cref="ServiceCollectionExtensions" /> partials.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CompositionModulesRegistrationDisciplineTests
{
    [Theory]
    [InlineData(typeof(AgentCompositionModule))]
    [InlineData(typeof(PipelineCompositionModule))]
    [InlineData(typeof(AlertsCompositionModule))]
    [InlineData(typeof(HostedCloudExtractorCompositionModule))]
    public void Composition_module_exposes_Register_in_Startup_Modules_namespace(Type moduleType)
    {
        moduleType.Namespace.Should().Be("ArchLucid.Host.Composition.Startup.Modules");

        MethodInfo? register = moduleType.GetMethod(
            "Register",
            BindingFlags.Public | BindingFlags.Static,
            binder: null,
            [typeof(IServiceCollection), typeof(IConfiguration)],
            modifiers: null);

        register.Should().NotBeNull($"{moduleType.Name} must expose public static Register(IServiceCollection, IConfiguration)");
        register!.ReturnType.Should().Be(typeof(void));
    }

    [Theory]
    [InlineData(typeof(WeeklyDigestCompositionModule))]
    [InlineData(typeof(TrialLifecycleCompositionModule))]
    public void Composition_module_exposes_Register_with_hosting_role_in_Startup_Modules_namespace(Type moduleType)
    {
        moduleType.Namespace.Should().Be("ArchLucid.Host.Composition.Startup.Modules");

        MethodInfo? register = moduleType.GetMethod(
            "Register",
            BindingFlags.Public | BindingFlags.Static,
            binder: null,
            [typeof(IServiceCollection), typeof(IConfiguration), typeof(ArchLucidHostingRole)],
            modifiers: null);

        register.Should().NotBeNull(
            $"{moduleType.Name} must expose public static Register(IServiceCollection, IConfiguration, ArchLucidHostingRole)");
        register!.ReturnType.Should().Be(typeof(void));
    }

    [Fact]
    public void ServiceCollectionExtensions_does_not_define_legacy_agent_or_pipeline_register_methods()
    {
        MethodInfo[] methods = typeof(ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions)
            .GetMethods(BindingFlags.NonPublic | BindingFlags.Static);

        string[] resurrected =
        [
            "RegisterAgentExecution",
            "RegisterRunExportAndArchitectureAnalysis",
            "RegisterRunReplayManifestAndDiffs",
            "RegisterContextIngestionAndKnowledgeGraph",
            "RegisterAlerts",
            "RegisterAzureOpenAiCircuitBreakerOptions",
        ];

        IEnumerable<string> found = methods
            .Select(m => m.Name)
            .Where(name => resurrected.Contains(name, StringComparer.Ordinal));

        found.Should().BeEmpty(
            "refactor #10 moved agent, pipeline, and alerts registrations into Startup.Modules; "
            + "reintroducing private Register* methods on ServiceCollectionExtensions would resurrect the mega-partial pattern");
    }

    [Fact]
    public void AgentCompositionModule_registers_agent_executor_services()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        AgentCompositionModule.Register(services, configuration);

        services.Should().Contain(static d => d.ServiceType == typeof(IAgentExecutor));
        services.Should().Contain(static d => d.ServiceType == typeof(IAgentCompletionClient));
        services.Should().Contain(static d => d.ServiceType == typeof(IAgentTierCompletionRouter));
    }

    [Fact]
    public void AgentRuntimeCompositionModule_registers_tier_completion_router_baseline()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];
        services.AddSingleton(configuration);
        services.AddLogging();

        AgentRuntimeCompositionModule.Register(services, configuration);

        services.Should().Contain(static d => d.ServiceType == typeof(IAgentTierCompletionRouter));
        services.Should().Contain(static d => d.ServiceType == typeof(IAgentCompletionClient));

        using ServiceProvider provider = services.BuildServiceProvider();
        using IServiceScope scope = provider.CreateScope();

        scope.ServiceProvider.GetRequiredService<IAgentTierCompletionRouter>().Should().NotBeNull();
    }

    [Fact]
    public void PipelineCompositionModule_registers_authority_commit_orchestrator()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        PipelineCompositionModule.Register(services, configuration);

        services.Should().Contain(static d =>
            d.ServiceType == typeof(IArchitectureRunCommitOrchestrator) &&
            d.ImplementationType == typeof(AuthorityDrivenArchitectureRunCommitOrchestrator));
        services.Should().Contain(static d => d.ServiceType == typeof(IContextIngestionService));
    }

    [Fact]
    public void AlertsCompositionModule_registers_alert_and_policy_pack_services()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        AlertsCompositionModule.Register(services, configuration);

        services.Should().Contain(static d => d.ServiceType == typeof(IAlertService));
        services.Should().Contain(static d => d.ServiceType == typeof(IPolicyPackWorkflowFacade));
    }

    [Fact]
    public void WeeklyDigestCompositionModule_registers_weekly_digest_services()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        WeeklyDigestCompositionModule.Register(services, configuration, ArchLucidHostingRole.Api);

        services.Should().Contain(static d => d.ServiceType == typeof(IExecDigestComposer));
        services.Should().Contain(static d => d.ServiceType == typeof(IWeeklySponsorReportEmailDispatcher));
        services.Should().Contain(static d => d.ServiceType == typeof(IWeeklySponsorSummaryEmailDispatcher));
        services.Should().Contain(static d => d.ServiceType == typeof(WeeklyArchitectureDigestJobRunner));
    }

    [Fact]
    public void HostedCloudExtractorCompositionModule_registers_hosted_extractor_services()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        HostedCloudExtractorCompositionModule.Register(services, configuration);

        services.Should().Contain(static d => d.ServiceType == typeof(IHostedAzureExtractorConfigurationService));
        services.Should().Contain(static d => d.ServiceType == typeof(IHostedAwsExtractorRunService));
        services.Should().Contain(static d => d.ServiceType == typeof(IHostedGcpExtractorRunService));
    }

    [Fact]
    public void TrialLifecycleCompositionModule_registers_trial_lifecycle_services()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        TrialLifecycleCompositionModule.Register(services, configuration, ArchLucidHostingRole.Api);

        services.Should().Contain(static d =>
            d.ServiceType == typeof(IAuditService) &&
            d.ImplementationType == typeof(TrialLifecycleEmailPublishingAuditDecorator));
        services.Should().Contain(static d => d.ServiceType == typeof(TrialArchitecturePreseedExecutor));
    }

    [Fact]
    public void PipelineCompositionModule_does_not_define_legacy_private_register_methods()
    {
        MethodInfo[] methods = typeof(PipelineCompositionModule)
            .GetMethods(BindingFlags.NonPublic | BindingFlags.Static);

        string[] resurrected =
        [
            "RegisterRunReplayManifestAndDiffs",
            "RegisterContextIngestionAndKnowledgeGraph",
        ];

        IEnumerable<string> found = methods
            .Select(m => m.Name)
            .Where(name => resurrected.Contains(name, StringComparer.Ordinal));

        found.Should().BeEmpty(
            "refactor #42 moved run-replay/manifest and context-ingestion registrations into pipeline registrars; "
            + "reintroducing private Register* methods on PipelineCompositionModule would resurrect the mega-module pattern");
    }

    [Theory]
    [InlineData(typeof(DraftIntakeCompositionRegistrar))]
    [InlineData(typeof(AuthorityCommitPipelineCompositionRegistrar))]
    [InlineData(typeof(RunLifecycleOrchestrationCompositionRegistrar))]
    [InlineData(typeof(SponsorRoiCompositionRegistrar))]
    [InlineData(typeof(ContextIngestionCompositionRegistrar))]
    public void Pipeline_registrar_exposes_Register_in_Startup_Modules_namespace(Type registrarType)
    {
        registrarType.Namespace.Should().Be("ArchLucid.Host.Composition.Startup.Modules");

        MethodInfo? register = registrarType.GetMethod(
            "Register",
            BindingFlags.Public | BindingFlags.Static,
            binder: null,
            [typeof(IServiceCollection), typeof(IConfiguration)],
            modifiers: null);

        register.Should().NotBeNull(
            $"{registrarType.Name} must expose public static Register(IServiceCollection, IConfiguration)");
        register!.ReturnType.Should().Be(typeof(void));
    }

    [Fact]
    public void AuthorityCommitPipelineCompositionRegistrar_registers_commit_orchestrator()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        AuthorityCommitPipelineCompositionRegistrar.Register(services, configuration);

        services.Should().Contain(static d =>
            d.ServiceType == typeof(IArchitectureRunCommitOrchestrator) &&
            d.ImplementationType == typeof(AuthorityDrivenArchitectureRunCommitOrchestrator));
    }

    [Fact]
    public void DraftIntakeCompositionRegistrar_registers_draft_request_service()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        DraftIntakeCompositionRegistrar.Register(services, configuration);

        services.Should().Contain(static d => d.ServiceType == typeof(IDraftRequestService));
    }

    [Fact]
    public void ContextIngestionCompositionRegistrar_registers_context_ingestion_service()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        ContextIngestionCompositionRegistrar.Register(services, configuration);

        services.Should().Contain(static d => d.ServiceType == typeof(IContextIngestionService));
    }

    [Fact]
    public void SponsorRoiCompositionRegistrar_registers_sponsor_roi_summary_service()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        SponsorRoiCompositionRegistrar.Register(services, configuration);

        services.Should().Contain(static d => d.ServiceType == typeof(ISponsorRoiSummaryService));
    }

    [Theory]
    [InlineData(ArchLucidHostingRole.Api)]
    [InlineData(ArchLucidHostingRole.Worker)]
    [InlineData(ArchLucidHostingRole.Combined)]
    public void AddArchLucidApplicationServices_still_resolves_module_owned_services(ArchLucidHostingRole role)
    {
        IConfiguration configuration = CreateModuleTestConfiguration(role);
        ServiceCollection services = [];

        Action act = () => _ = services.AddArchLucidApplicationServices(configuration, role);

        act.Should().NotThrow();

        services.Should().Contain(static d => d.ServiceType == typeof(IAgentExecutor));
        services.Should().Contain(static d => d.ServiceType == typeof(IArchitectureRunCommitOrchestrator));
        services.Should().Contain(static d => d.ServiceType == typeof(IAlertService));
        services.Should().Contain(static d => d.ServiceType == typeof(DataArchivalHostHealthState));
        services.Should().Contain(static d => d.ServiceType == typeof(IRetrievalIndexingOutboxProcessor));
        services.Should().Contain(static d => d.ServiceType == typeof(IScanScheduleCalculator));
    }

    [Theory]
    [InlineData(typeof(HostedServicesCompositionRegistrar))]
    [InlineData(typeof(OutboxProcessorsCompositionRegistrar))]
    [InlineData(typeof(AdvisoryDigestSchedulingRegistrar))]
    public void Scheduling_registrar_exposes_Register_in_Startup_Modules_namespace(Type registrarType)
    {
        registrarType.Namespace.Should().Be("ArchLucid.Host.Composition.Startup.Modules");

        MethodInfo? register = registrarType.GetMethod(
            "Register",
            BindingFlags.Public | BindingFlags.Static,
            binder: null,
            [typeof(IServiceCollection), typeof(IConfiguration), typeof(ArchLucidHostingRole)],
            modifiers: null);

        register.Should().NotBeNull(
            $"{registrarType.Name} must expose public static Register(IServiceCollection, IConfiguration, ArchLucidHostingRole)");
        register!.ReturnType.Should().Be(typeof(void));
    }

    [Fact]
    public void ServiceCollectionExtensions_keeps_scheduling_and_alerts_wrapper_methods()
    {
        MethodInfo[] methods = typeof(ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions)
            .GetMethods(BindingFlags.NonPublic | BindingFlags.Static);

        string[] wrappers =
        [
            "RegisterDataArchivalHostedService",
            "RegisterRetrievalIndexingOutbox",
            "RegisterAdvisoryScheduling",
            "RegisterDigestDelivery",
            "RegisterIntegrationEventPublishing",
        ];

        foreach (string name in wrappers)
        {
            methods.Should().Contain(
                m => m.Name == name,
                $"refactor #39 keeps {name} as a thin wrapper so AddArchLucidApplicationServices call sites stay stable");
        }
    }

    [Fact]
    public void HostedServicesCompositionRegistrar_registers_archival_health_state()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        HostedServicesCompositionRegistrar.Register(services, configuration, ArchLucidHostingRole.Api);

        services.Should().Contain(static d => d.ServiceType == typeof(DataArchivalHostHealthState));
    }

    [Fact]
    public void OutboxProcessorsCompositionRegistrar_registers_outbox_and_integration_services()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        OutboxProcessorsCompositionRegistrar.Register(services, configuration, ArchLucidHostingRole.Api);

        services.Should().Contain(static d => d.ServiceType == typeof(IRetrievalIndexingOutboxProcessor));
        services.Should().Contain(static d => d.ServiceType == typeof(IAuthorityPipelineWorkProcessor));
        services.Should().Contain(static d => d.ServiceType == typeof(IAzureDevOpsCommitStatusPublisher));
        services.Should().Contain(static d => d.ServiceType == typeof(IIntegrationEventPublisher));
    }

    [Fact]
    public void AdvisoryDigestSchedulingRegistrar_registers_scan_and_digest_services()
    {
        IConfiguration configuration = CreateModuleTestConfiguration();
        ServiceCollection services = [];

        AdvisoryDigestSchedulingRegistrar.Register(services, configuration, ArchLucidHostingRole.Api);

        services.Should().Contain(static d => d.ServiceType == typeof(IScanScheduleCalculator));
        services.Should().Contain(static d => d.ServiceType == typeof(IDigestDeliveryDispatcher));
    }

    private static IConfiguration CreateModuleTestConfiguration(ArchLucidHostingRole role = ArchLucidHostingRole.Api)
    {
        string roleString = role switch
        {
            ArchLucidHostingRole.Api => "Api",
            ArchLucidHostingRole.Worker => "Worker",
            _ => "Combined"
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Hosting:Role"] = roleString,
                    ["ConnectionStrings:ArchLucid"] =
                        "Server=localhost;Database=ArchLucidCompositionTests;Trusted_Connection=True;TrustServerCertificate=True",
                    ["ArchLucid:StorageProvider"] = "InMemory",
                    ["AgentExecution:Mode"] = "Simulator",
                    ["AzureOpenAI:Endpoint"] = "",
                    ["AzureOpenAI:ApiKey"] = "",
                    ["AzureOpenAI:DeploymentName"] = "",
                    ["AzureOpenAI:EmbeddingDeploymentName"] = "",
                    ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
                    ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
                    ["RateLimiting:Expensive:PermitLimit"] = "100000",
                    ["RateLimiting:Expensive:WindowMinutes"] = "1"
                })
            .Build();
    }
}
