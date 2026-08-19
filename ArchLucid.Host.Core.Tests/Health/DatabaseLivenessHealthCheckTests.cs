using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Health;
using ArchLucid.Persistence.Connections;

using FluentAssertions;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Host.Core.Tests.Health;

[Trait("Category", "Unit")]
public sealed class DatabaseLivenessHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_skips_probe_when_storage_is_in_memory()
    {
        DatabaseLivenessHealthCheck check = new(
            new UnusedSystemSqlConnectionFactory(),
            Options.Create(new ArchLucidOptions { StorageProvider = "InMemory" }),
            Options.Create(new DatabaseLivenessHealthCheckOptions()));

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("skipped");
    }

    [Fact]
    public async Task CheckHealthAsync_unhealthy_when_system_connection_fails()
    {
        Mock<ISystemSqlConnectionFactory> systemFactory = new();
        systemFactory
            .Setup(f => f.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("control-plane SQL unavailable"));

        DatabaseLivenessHealthCheck check = new(
            systemFactory.Object,
            Options.Create(new ArchLucidOptions { StorageProvider = "Sql" }),
            Options.Create(new DatabaseLivenessHealthCheckOptions()));

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("liveness probe failed");
    }
}
