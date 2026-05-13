using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Health;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Branch coverage for <see cref="RlsSessionContextInfrastructureHealthCheck" /> (SQL round-trip is integration-only).
/// </summary>
[Trait("Category", "Unit")]
public sealed class RlsSessionContextInfrastructureHealthCheckTests
{
    [Fact]
    public async Task Healthy_when_storage_is_InMemory()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();
        RlsSessionContextInfrastructureHealthCheck sut = new(
            configuration,
            Options.Create(new ArchLucidOptions { StorageProvider = "InMemory" }));

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description!.Should().Contain("InMemory", StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Unhealthy_when_connection_string_missing_and_storage_is_Sql()
    {
        IConfiguration configuration = new ConfigurationBuilder().Build();
        RlsSessionContextInfrastructureHealthCheck sut = new(
            configuration,
            Options.Create(new ArchLucidOptions { StorageProvider = "Sql" }));

        HealthCheckResult result = await sut.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description!.Should().Contain("ConnectionStrings", StringComparison.Ordinal);
    }
}
