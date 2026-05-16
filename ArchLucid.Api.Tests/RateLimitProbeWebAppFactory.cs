using ArchLucid.TestSupport;

using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Minimal host aligned with <see cref="OpenApiContractWebAppFactory" /> but with a deliberately tiny fixed-window
///     permit budget so rate-limit rejection paths can be exercised deterministically.
/// </summary>
/// <remarks>
///     Subclassing <see cref="OpenApiContractWebAppFactory" /> and layering overrides is unreliable here because that base
///     registers an in-memory <c>RateLimiting:FixedWindow:PermitLimit</c> that wins later configuration layering for tests.
/// </remarks>
internal sealed class RateLimitProbeWebAppFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.UseSetting("DataConsistency:InitialDelaySeconds", "0");
        builder.UseSetting("HostLeaderElection:Enabled", "false");

        // UseSetting wins reliably over appsettings.Development.json (e.g. PermitLimit 2000) under WebApplicationFactory;
        // ConfigureAppConfiguration alone can lose ordering to layered JSON.
        builder.UseSetting("ASPNETCORE_URLS", "http://127.0.0.1:0");
        builder.UseSetting("RateLimiting:FixedWindow:PermitLimit", "1");
        builder.UseSetting("RateLimiting:FixedWindow:WindowMinutes", "1");
        builder.UseSetting("RateLimiting:FixedWindow:QueueLimit", "0");
        builder.UseSetting("RateLimiting:RoleMultipliers:Anonymous", "1");
        builder.UseSetting("RateLimiting:RoleMultipliers:Reader", "1");
        builder.UseSetting("RateLimiting:RoleMultipliers:Operator", "1");
        builder.UseSetting("RateLimiting:RoleMultipliers:Admin", "1");

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
                ["RateLimiting:FixedWindow:PermitLimit"] = "1",
                ["RateLimiting:FixedWindow:WindowMinutes"] = "1",
                ["RateLimiting:FixedWindow:QueueLimit"] = "0",
                ["RateLimiting:RoleMultipliers:Anonymous"] = "1",
                ["RateLimiting:RoleMultipliers:Reader"] = "1",
                ["RateLimiting:RoleMultipliers:Operator"] = "1",
                ["RateLimiting:RoleMultipliers:Admin"] = "1",
                ["RateLimiting:Expensive:PermitLimit"] = "100000",
                ["RateLimiting:Expensive:WindowMinutes"] = "1",
                ["RateLimiting:Replay:Light:PermitLimit"] = "100000",
                ["RateLimiting:Replay:Heavy:PermitLimit"] = "100000",
                ["RateLimiting:Registration:PermitLimit"] = "100000",
                ["RateLimiting:Registration:WindowMinutes"] = "1",
                ["Billing:Provider"] = "Noop",
                ["ASPNETCORE_URLS"] = "http://127.0.0.1:0"
            };

            ApiTestWebHostLogging.AddQuietDefaultLogLevel(settings);
            config.AddInMemoryCollection(settings);
        });
    }
}
