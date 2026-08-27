using ArchLucid.AgentRuntime;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Core.Retrieval;
using ArchLucid.Host.Composition.Startup;
using ArchLucid.Host.Core.Hosting;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Host.Composition.Tests.Startup;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentTierCompletionRouterRegistrationTests
{
    [Theory]
    [InlineData("Simulator", false)]
    [InlineData("Real", false)]
    [InlineData("Simulator", true)]
    [InlineData("Real", true)]
    public void AddArchLucidApplicationServices_registers_IAgentTierCompletionRouter(
        string agentExecutionMode,
        bool allowHeaderOverride)
    {
        Dictionary<string, string?> data = new()
        {
            ["Hosting:Role"] = "Api",
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ConnectionStrings:ArchLucid"] =
                "Server=localhost;Database=ArchLucidTierRouterTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["AgentExecution:Mode"] = agentExecutionMode,
            ["DeveloperExperience:AllowAgentExecutionModeHeaderOverride"] = allowHeaderOverride ? "true" : "false",
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

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CompositionTestServices.Create(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        services.Should().Contain(static d => d.ServiceType == typeof(IAgentTierCompletionRouter));
    }

    [Fact]
    public void Development_like_config_resolves_tier_router_dependent_services()
    {
        Dictionary<string, string?> data = new()
        {
            ["Hosting:Role"] = "Combined",
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ConnectionStrings:ArchLucid"] =
                "Server=localhost;Database=ArchLucidTierRouterTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["AgentExecution:Mode"] = "Simulator",
            ["DeveloperExperience:AllowAgentExecutionModeHeaderOverride"] = "true",
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

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        ServiceCollection services = CompositionTestServices.Create(configuration);

        _ = services.AddArchLucidApplicationServices(configuration, ArchLucidHostingRole.Api);

        using ServiceProvider provider = services.BuildServiceProvider();
        using IServiceScope scope = provider.CreateScope();

        scope.ServiceProvider.GetRequiredService<IAgentTierCompletionRouter>().Should().NotBeNull();
        scope.ServiceProvider.GetRequiredService<IManifestChunkSummaryCompletionClient>().Should().NotBeNull();
        scope.ServiceProvider.GetRequiredService<IAgenticRetrievalCompletionClient>().Should().NotBeNull();
        scope.ServiceProvider.GetRequiredService<IGraphCommunitySummaryCompletionClient>().Should().NotBeNull();
        scope.ServiceProvider.GetRequiredService<IAgentHandler>().Should().NotBeNull();
    }
}

internal static class CompositionTestServices
{
    public static ServiceCollection Create(IConfiguration configuration)
    {
        ServiceCollection services = [];
        services.AddSingleton(configuration);
        services.AddSingleton<IHostEnvironment>(new CompositionTestHostEnvironment(Environments.Development));
        services.AddSingleton<IWebHostEnvironment>(new CompositionTestHostEnvironment(Environments.Development));
        services.AddSingleton<IHostApplicationLifetime, CompositionTestHostApplicationLifetime>();
        services.AddLogging();
        services.AddHttpContextAccessor();
        services.AddSingleton<ArchLucid.Core.Scoping.IScopeContextProvider, FixedCompositionScopeContextProvider>();

        return services;
    }

    private sealed class FixedCompositionScopeContextProvider : ArchLucid.Core.Scoping.IScopeContextProvider
    {
        public ArchLucid.Core.Scoping.ScopeContext GetCurrentScope()
        {
            return new ArchLucid.Core.Scoping.ScopeContext
            {
                TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
            };
        }
    }
}
