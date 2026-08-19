using ArchLucid.Host.Core.Health;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArchLucid.Host.Core.Tests.Health;

[Trait("Category", "Unit")]
public sealed class VectorStoreHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_is_healthy_when_vector_index_is_in_memory()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?> { ["Retrieval:VectorIndex"] = "InMemory" });

        VectorStoreHealthCheck check = new(configuration, new ServiceCollection().BuildServiceProvider());

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("InMemory");
    }

    [Fact]
    public async Task CheckHealthAsync_is_degraded_when_azure_search_client_is_not_configured()
    {
        IConfiguration configuration = BuildConfiguration(
            new Dictionary<string, string?> { ["Retrieval:VectorIndex"] = "AzureSearch" });

        VectorStoreHealthCheck check = new(configuration, new ServiceCollection().BuildServiceProvider());

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("not configured");
    }

    private static IConfiguration BuildConfiguration(IReadOnlyDictionary<string, string?> values)
    {
        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }
}
