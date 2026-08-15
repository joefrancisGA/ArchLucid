using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Composition.Orchestration;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Core.Hosting;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Composition.Tests;

/// <summary>
///     TB-922 — composition smoke for the dormant Durable Task orchestrator backend selection path.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DtfAuthorityRunOrchestratorCompositionSmokeTests
{
    [Fact]
    public void Sql_storage_registers_DtfAuthorityRunOrchestrator_as_port()
    {
        IConfiguration configuration = CreateSqlCompositionConfiguration(orchestratorBackend: null);
        ServiceCollection services = CreateCompositionServices(configuration);

        Action act = () => _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        act.Should().NotThrow();

        ServiceDescriptor? portRegistration = services.SingleOrDefault(static descriptor =>
            descriptor.ServiceType == typeof(IAuthorityRunOrchestrator));

        portRegistration.Should().NotBeNull();
        portRegistration!.ImplementationType.Should().Be(typeof(DtfAuthorityRunOrchestrator));
    }

    [Fact]
    public void Sql_storage_with_DurableTask_backend_registers_dtf_worker_and_client_without_di_errors()
    {
        IConfiguration configuration = CreateSqlCompositionConfiguration(
            orchestratorBackend: "DurableTask",
            durableTaskGrpcEndpoint: "http://127.0.0.1:5001");
        ServiceCollection services = CreateCompositionServices(configuration);

        Action act = () => _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Worker);

        act.Should().NotThrow();

        services.Should().Contain(static descriptor => descriptor.ServiceType == typeof(IAuthorityRunOrchestrator));
    }

    [Fact]
    public void Sql_storage_full_composition_with_DurableTask_backend_validates_on_build()
    {
        IConfiguration configuration = CreateSqlCompositionConfiguration(
            orchestratorBackend: "DurableTask",
            durableTaskGrpcEndpoint: "http://127.0.0.1:5001");
        ServiceCollection services = CreateCompositionServices(configuration);
        services.AddHttpContextAccessor();
        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        ServiceProviderOptions options = new() { ValidateOnBuild = true, ValidateScopes = true };
        Action act = () =>
        {
            ServiceProvider provider = services.BuildServiceProvider(options);
            provider.Dispose();
        };

        act.Should().NotThrow();
    }

    private static ServiceCollection CreateCompositionServices(IConfiguration configuration)
    {
        ServiceCollection services = [];
        services.AddSingleton(typeof(IConfiguration), configuration);
        CompositionTestHostEnvironment hostEnvironment = new(Environments.Development);
        services.AddSingleton<IHostEnvironment>(hostEnvironment);
        services.AddSingleton<IWebHostEnvironment>(hostEnvironment);
        services.AddSingleton<IHostApplicationLifetime, CompositionTestHostApplicationLifetime>();
        services.AddLogging();
        services.AddSingleton<IScopeContextProvider, FixedCompositionScopeContextProvider>();

        return services;
    }

    private static IConfiguration CreateSqlCompositionConfiguration(
        string? orchestratorBackend,
        string? durableTaskGrpcEndpoint = null)
    {
        Dictionary<string, string?> values = new()
        {
            ["Hosting:Role"] = "Api",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidDtfSmokeTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucid:StorageProvider"] = "Sql",
            ["AgentExecution:Mode"] = "Simulator",
            ["AzureOpenAI:Endpoint"] = "",
            ["AzureOpenAI:ApiKey"] = "",
            ["AzureOpenAI:DeploymentName"] = "",
            ["AzureOpenAI:EmbeddingDeploymentName"] = "",
            ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
            ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
            ["RateLimiting:Expensive:PermitLimit"] = "100000",
            ["RateLimiting:Expensive:WindowMinutes"] = "1",
            ["RateLimiting:Replay:Light:PermitLimit"] = "100000",
            ["RateLimiting:Replay:Heavy:PermitLimit"] = "100000",
            ["FeatureManagement:FeatureFlags:AsyncAuthorityPipeline"] = "false",
            ["CosmosDb:GraphSnapshotsEnabled"] = "false",
            ["LlmCompletionCache:Enabled"] = "false",
            ["HotPathCache:Enabled"] = "false"
        };

        if (!string.IsNullOrWhiteSpace(orchestratorBackend))
            values["ArchLucid:AuthorityPipeline:OrchestratorBackend"] = orchestratorBackend;

        if (!string.IsNullOrWhiteSpace(durableTaskGrpcEndpoint))
            values["ArchLucid:AuthorityPipeline:DurableTask:GrpcEndpoint"] = durableTaskGrpcEndpoint;

        return new ConfigurationBuilder().AddInMemoryCollection(values).Build();
    }

    private sealed class FixedCompositionScopeContextProvider : IScopeContextProvider
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
