using System.Net;
using System.Net.Sockets;

using ArchLucid.Host.Core.Health;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Tests.Health;
[Trait("Category", "Unit")]

public sealed class AzureOpenAiHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_skips_probe_when_agent_execution_is_simulator()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["AgentExecution:Mode"] = "Simulator",
                ["AzureOpenAI:Endpoint"] = "https://example.openai.azure.com/",
            });

        AzureOpenAiHealthCheck check = new(configuration);

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("skipped");
    }

    [Fact]
    public async Task CheckHealthAsync_is_unhealthy_when_real_mode_and_endpoint_missing()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["AgentExecution:Mode"] = "Real",
                ["AgentExecution:CompletionClient"] = "AzureOpenAi",
            });

        AzureOpenAiHealthCheck check = new(configuration);

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("AzureOpenAI:Endpoint");
    }

    [Fact]
    public async Task CheckHealthAsync_is_unhealthy_when_endpoint_url_is_invalid()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["AgentExecution:Mode"] = "Real",
                ["AgentExecution:CompletionClient"] = "AzureOpenAi",
                ["AzureOpenAI:Endpoint"] = "not-a-url",
            });

        AzureOpenAiHealthCheck check = new(configuration);

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("valid absolute URL");
    }

    [Fact]
    public async Task CheckHealthAsync_is_healthy_when_tcp_endpoint_is_reachable()
    {
        TcpListener listener = new(IPAddress.Loopback, port: 0);
        listener.Start();

        int port = ((IPEndPoint)listener.LocalEndpoint).Port;

        try
        {
            IConfiguration configuration = BuildConfiguration(
                new Dictionary<string, string?>
                {
                    ["AgentExecution:Mode"] = "Real",
                    ["AgentExecution:CompletionClient"] = "AzureOpenAi",
                    ["AzureOpenAI:Endpoint"] = string.Format("http://{0}:{1}/", IPAddress.Loopback, port),
                });

            AzureOpenAiHealthCheck check = new(configuration);

            HealthCheckResult result =
                await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

            result.Status.Should().Be(HealthStatus.Healthy);
            result.Description.Should().Contain("TCP reachable");
        }
        finally
        {
            listener.Stop();
        }
    }

    [Fact]
    public async Task CheckHealthAsync_is_unhealthy_when_tcp_endpoint_is_not_listening()
    {
        TcpListener listener = new(IPAddress.Loopback, port: 0);
        listener.Start();

        int port = ((IPEndPoint)listener.LocalEndpoint).Port;

        listener.Stop();

        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?>
            {
                ["AgentExecution:Mode"] = "Real",
                ["AgentExecution:CompletionClient"] = "AzureOpenAi",
                ["AzureOpenAI:Endpoint"] = string.Format("http://{0}:{1}/", IPAddress.Loopback, port),
            });

        AzureOpenAiHealthCheck check = new(configuration);

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Unhealthy);
    }

    private static IConfiguration BuildConfiguration(Dictionary<string, string?> values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values).Build();
}
