using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Startup;

using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Health;

/// <summary>Reports degraded readiness when DbUp failed but the host was allowed to continue.</summary>
public sealed class StartupDatabaseMigrationHealthCheck(
    StartupMigrationHealthState state,
    IOptions<ArchLucidPersistenceOptions> persistenceOptions) : IHealthCheck
{
    private readonly StartupMigrationHealthState _state =
        state ?? throw new ArgumentNullException(nameof(state));

    private readonly IOptions<ArchLucidPersistenceOptions> _persistenceOptions =
        persistenceOptions ?? throw new ArgumentNullException(nameof(persistenceOptions));

    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (!_state.MigrationFailed)

            return Task.FromResult(HealthCheckResult.Healthy("Database migrations completed at startup."));

        if (_persistenceOptions.Value.AllowDegradedStartupAfterMigrationFailure)

            return Task.FromResult(
                HealthCheckResult.Degraded(
                    "Database migrations failed at startup; host continues via ArchLucid:Persistence:AllowDegradedStartupAfterMigrationFailure."));

        return Task.FromResult(
            HealthCheckResult.Unhealthy(
                "Database migrations failed at startup (unexpected — host should not have started)."));
    }
}
