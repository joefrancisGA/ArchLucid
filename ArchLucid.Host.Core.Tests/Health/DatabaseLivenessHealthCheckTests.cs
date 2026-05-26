using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Health;
using ArchLucid.Persistence.Connections;

using FluentAssertions;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

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
}
