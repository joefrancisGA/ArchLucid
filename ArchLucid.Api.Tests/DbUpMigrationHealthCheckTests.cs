using ArchLucid.Api.Health;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Connections;

using FluentAssertions;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Api")]
[Trait("Category", "Unit")]
public sealed class DbUpMigrationHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_in_memory_storage_skips_sql_probe()
    {
        Mock<ISqlConnectionFactory> connectionFactory = new();
        DbUpMigrationHealthCheck check = new(
            Options.Create(new ArchLucidOptions { StorageProvider = "InMemory" }),
            connectionFactory.Object);

        HealthCheckResult result = await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("InMemory");
        connectionFactory.Verify(
            factory => factory.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CheckHealthAsync_when_sql_probe_fails_returns_unhealthy()
    {
        Mock<ISqlConnectionFactory> connectionFactory = new();
        connectionFactory
            .Setup(factory => factory.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("connection failed"));

        DbUpMigrationHealthCheck check = new(
            Options.Create(new ArchLucidOptions { StorageProvider = "Sql" }),
            connectionFactory.Object);

        HealthCheckResult result = await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("probe failed");
    }
}
