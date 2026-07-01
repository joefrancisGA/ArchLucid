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
public sealed class SqlSystemPlaneHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_skips_when_storage_is_in_memory()
    {
        SqlSystemPlaneHealthCheck check = CreateCheck(
            new ArchLucidOptions { StorageProvider = "InMemory" },
            new SqlTopologyOptions { Mode = SqlTopologyMode.SystemWithPerTenantCatalogs },
            Mock.Of<ISystemSqlConnectionFactory>());

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("skipped");
    }

    [Fact]
    public async Task CheckHealthAsync_skips_in_single_catalog_mode()
    {
        SqlSystemPlaneHealthCheck check = CreateCheck(
            new ArchLucidOptions { StorageProvider = "Sql" },
            new SqlTopologyOptions { Mode = SqlTopologyMode.SingleCatalog },
            Mock.Of<ISystemSqlConnectionFactory>());

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("single-catalog");
    }

    [Fact]
    public async Task CheckHealthAsync_unhealthy_when_system_catalog_open_fails()
    {
        Mock<ISystemSqlConnectionFactory> systemFactory = new();
        systemFactory
            .Setup(f => f.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("system catalog unreachable"));

        SqlSystemPlaneHealthCheck check = CreateCheck(
            new ArchLucidOptions { StorageProvider = "Sql" },
            new SqlTopologyOptions { Mode = SqlTopologyMode.SystemWithPerTenantCatalogs },
            systemFactory.Object);

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("System SQL catalog connection failed");
        result.Exception.Should().NotBeNull();
    }

    private static SqlSystemPlaneHealthCheck CreateCheck(
        ArchLucidOptions archLucidOptions,
        SqlTopologyOptions topologyOptions,
        ISystemSqlConnectionFactory systemSqlConnectionFactory)
    {
        Mock<IOptionsMonitor<SqlTopologyOptions>> topologyMonitor = new();
        topologyMonitor.Setup(m => m.CurrentValue).Returns(topologyOptions);

        return new SqlSystemPlaneHealthCheck(
            Options.Create(archLucidOptions),
            topologyMonitor.Object,
            systemSqlConnectionFactory);
    }
}
