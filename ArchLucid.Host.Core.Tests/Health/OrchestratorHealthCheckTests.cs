using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Health;

using FluentAssertions;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Tests.Health;

[Trait("Category", "Unit")]
public sealed class OrchestratorHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_skips_probe_when_storage_is_in_memory()
    {
        OrchestratorHealthCheck check = new(
            new ThrowingDbConnectionFactory(),
            Options.Create(new ArchLucidOptions { StorageProvider = "InMemory" }));

        HealthCheckResult result =
            await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description!.ToLowerInvariant().Should().Contain("inmemory");
    }

    [Fact]
    public void RegistrationName_is_orchestrator()
    {
        OrchestratorHealthCheck.RegistrationName.Should().Be("orchestrator");
        OperationalDetailedHealthChecks.IsIncluded(OrchestratorHealthCheck.RegistrationName).Should().BeTrue();
    }

    private sealed class ThrowingDbConnectionFactory : ArchLucid.Persistence.Data.Infrastructure.IDbConnectionFactory
    {
        public System.Data.IDbConnection CreateConnection() =>
            throw new InvalidOperationException("SQL should not be opened for InMemory skip test.");

        public Task<System.Data.IDbConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default) =>
            throw new InvalidOperationException("SQL should not be opened for InMemory skip test.");
    }
}
