using ArchLucid.AgentRuntime;
using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Host.Composition.Startup.Modules;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArchLucid.Host.Composition.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentExecutionModeNullRegistrationTests
{
    [Fact]
    public void AgentCompositionModule_null_agent_execution_mode_registers_simulator_executor()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["Hosting:Role"] = "Api",
                    ["ConnectionStrings:ArchLucid"] =
                        "Server=localhost;Database=ArchLucidCompositionTests;Trusted_Connection=True;TrustServerCertificate=True",
                    ["ArchLucid:StorageProvider"] = "InMemory",
                    ["AgentExecution:Mode"] = null,
                    ["AzureOpenAI:Endpoint"] = "",
                    ["AzureOpenAI:ApiKey"] = "",
                    ["AzureOpenAI:DeploymentName"] = "",
                    ["AzureOpenAI:EmbeddingDeploymentName"] = "",
                    ["RateLimiting:FixedWindow:PermitLimit"] = "100000",
                    ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
                    ["RateLimiting:Expensive:PermitLimit"] = "100000",
                    ["RateLimiting:Expensive:WindowMinutes"] = "1",
                    ["LlmCompletionCache:Enabled"] = "false",
                    ["HotPathCache:Enabled"] = "false",
                })
            .Build();

        ServiceCollection services = [];
        services.AddLogging();

        AgentCompositionModule.Register(services, configuration);

        services.Should().NotContain(static d =>
            d.ServiceType == typeof(IAgentExecutor) && d.ImplementationType == typeof(RealAgentExecutor));
        services.Should().Contain(static d => d.ServiceType == typeof(SimulatorExecutionTraceRecordingExecutor));
    }
}
