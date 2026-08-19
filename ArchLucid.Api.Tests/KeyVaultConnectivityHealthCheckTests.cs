using ArchLucid.Api.Health;

using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Api")]
[Trait("Category", "Unit")]
public sealed class KeyVaultConnectivityHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_WhenUriNotSet_ReturnsHealthySkipped()
    {
        IConfiguration config = new ConfigurationBuilder().AddInMemoryCollection().Build();
        KeyVaultConnectivityHealthCheck check = new(config, NullLogger<KeyVaultConnectivityHealthCheck>.Instance);

        HealthCheckResult result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("skipped");
    }

    [Fact]
    public async Task CheckHealthAsync_WhenUriInvalid_ReturnsUnhealthy()
    {
        IConfiguration config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ArchLucid:Secrets:KeyVaultUri"] = "not-a-uri"
        }).Build();
        KeyVaultConnectivityHealthCheck check = new(config, NullLogger<KeyVaultConnectivityHealthCheck>.Instance);

        HealthCheckResult result = await check.CheckHealthAsync(new HealthCheckContext());

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("absolute https URI");
    }
}
