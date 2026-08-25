using System.Reflection;

using ArchLucid.AgentRuntime;
using ArchLucid.Application.Governance.PolicyPacks;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Persistence.Ports;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Core.Agents;
using ArchLucid.Core.Alerts;
using ArchLucid.Core.Integration;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Advisory.Scheduling;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Composition.Startup.Modules;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Hosting;
using ArchLucid.Persistence.Coordination.Retrieval;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests.Startup;

/// <summary>
///     Pins host-composition refactors #10 and #39: agent, pipeline, and alerts bounded-context modules
///     plus scheduling/outbox registrars own their DI registrations instead of mega
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
