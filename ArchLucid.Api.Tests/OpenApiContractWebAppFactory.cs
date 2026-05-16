using ArchLucid.TestSupport;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Minimal API host for OpenAPI contract checks: in-memory authority storage, no SQL, Development pipeline
///     (Scalar + <c>/swagger/v1/swagger.json</c> + Microsoft OpenAPI; generation uses <c>CustomSchemaIds</c> and optional
///     auth security filters).
/// </summary>
/// <remarks>
///     Matches <see cref="ArchLucidApiFactory" /> knobs that gate readiness under CI/agent env leakage:
///     <see cref="ArchLucid.Core.Integration.IntegrationEventsOptions" /> clears so
///     <see cref="ArchLucid.Api.Health.AzureServiceBusNamespaceHealthCheck" /> does not open real Service Bus connections;
///     leader election disabled so reconciliation timing matches local runs.
/// </remarks>
public class OpenApiContractWebAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.UseSetting("DataConsistency:InitialDelaySeconds", "0");
        builder.UseSetting("HostLeaderElection:Enabled", "false");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            Dictionary<string, string?> settings = new()
            {
                ["ArchLucid:StorageProvider"] = "InMemory",
                ["ConnectionStrings:ArchLucid"] = InMemoryStartupSqlConnectionStringSentinel.Value,
                ["DataConsistency:InitialDelaySeconds"] = "0",
                ["HostLeaderElection:Enabled"] = "false",
                ["IntegrationEvents:QueueOrTopicName"] = "",
                ["IntegrationEvents:ServiceBusConnectionString"] = "",
                ["IntegrationEvents:ServiceBusFullyQualifiedNamespace"] = "",
                ["IntegrationEvents:ServiceBusManagedIdentityClientId"] = "",
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
                ["RateLimiting:Registration:PermitLimit"] = "100000",
                ["RateLimiting:Registration:WindowMinutes"] = "1",
                ["Billing:Provider"] = "Noop"
            };

            ApiTestWebHostLogging.AddQuietDefaultLogLevel(settings);
            config.AddInMemoryCollection(settings);
        });
    }
}
