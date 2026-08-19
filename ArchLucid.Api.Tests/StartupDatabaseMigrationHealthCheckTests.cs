using ArchLucid.Api.Health;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Startup;

using FluentAssertions;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Api")]
[Trait("Category", "Unit")]
public sealed class StartupDatabaseMigrationHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_when_migrations_succeeded_returns_healthy()
    {
        StartupDatabaseMigrationHealthCheck check = CreateCheck(
            migrationFailed: false,
            allowDegradedStartupAfterMigrationFailure: false);

        HealthCheckResult result = await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Healthy);
        result.Description.Should().Contain("completed");
    }

    [Fact]
    public async Task CheckHealthAsync_when_migrations_failed_and_degraded_allowed_returns_degraded()
    {
        StartupDatabaseMigrationHealthCheck check = CreateCheck(
            migrationFailed: true,
            allowDegradedStartupAfterMigrationFailure: true);

        HealthCheckResult result = await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Degraded);
        result.Description.Should().Contain("AllowDegradedStartupAfterMigrationFailure");
    }

    [Fact]
    public async Task CheckHealthAsync_when_migrations_failed_and_degraded_not_allowed_returns_unhealthy()
    {
        StartupDatabaseMigrationHealthCheck check = CreateCheck(
            migrationFailed: true,
            allowDegradedStartupAfterMigrationFailure: false);

        HealthCheckResult result = await check.CheckHealthAsync(new HealthCheckContext(), CancellationToken.None);

        result.Status.Should().Be(HealthStatus.Unhealthy);
        result.Description.Should().Contain("should not have started");
    }

    private static StartupDatabaseMigrationHealthCheck CreateCheck(
        bool migrationFailed,
        bool allowDegradedStartupAfterMigrationFailure)
    {
        StartupMigrationHealthState state = new();

        if (migrationFailed)
            state.MarkMigrationFailed();

        ArchLucidPersistenceOptions options = new()
        {
            AllowDegradedStartupAfterMigrationFailure = allowDegradedStartupAfterMigrationFailure,
        };

        return new StartupDatabaseMigrationHealthCheck(state, Options.Create(options));
    }
}
