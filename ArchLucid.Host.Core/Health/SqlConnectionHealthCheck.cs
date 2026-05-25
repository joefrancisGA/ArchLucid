using System.Diagnostics;

using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Connections;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Health;

/// <summary>
/// Probes the database via <see cref="IDbConnectionFactory"/> when <see cref="ArchLucidOptions.StorageProvider"/> is Sql.
/// Skips (Healthy) for InMemory storage so readiness reflects the configured persistence mode.
/// </summary>
public sealed class SqlConnectionHealthCheck(
    IDbConnectionFactory connectionFactory,
    IOptions<ArchLucidOptions> archLucidOptions,
    IOptions<SqlConnectionHealthCheckOptions> healthCheckOptions) : IHealthCheck
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IOptions<ArchLucidOptions> _archLucidOptions =
        archLucidOptions ?? throw new ArgumentNullException(nameof(archLucidOptions));

    private readonly IOptions<SqlConnectionHealthCheckOptions> _healthCheckOptions =
        healthCheckOptions ?? throw new ArgumentNullException(nameof(healthCheckOptions));

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))

            return HealthCheckResult.Healthy(
                "Database readiness skipped: storage is InMemory (no SQL persistence).");

        int degradedThresholdMs = Math.Max(1, _healthCheckOptions.Value.DegradedThresholdMs);
        Stopwatch stopwatch = Stopwatch.StartNew();

        try
        {
            await using System.Data.Common.DbConnection connection =
                (System.Data.Common.DbConnection)await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

            await using System.Data.Common.DbCommand command = connection.CreateCommand();
            command.CommandText = "SELECT 1;";
            _ = await command.ExecuteScalarAsync(cancellationToken);

            stopwatch.Stop();

            if (stopwatch.ElapsedMilliseconds > degradedThresholdMs)
            {
                return HealthCheckResult.Degraded(
                    $"Database responded in {stopwatch.ElapsedMilliseconds}ms (threshold: {degradedThresholdMs}ms).");
            }

            return HealthCheckResult.Healthy(
                $"Database connection successful ({stopwatch.ElapsedMilliseconds}ms).");
        }
        catch (SqlException ex) when (SqlTransientDetector.IsTransient(ex))
        {
            return HealthCheckResult.Degraded("Database connection hit a transient error.", ex);
        }
        catch (TimeoutException ex)
        {
            return HealthCheckResult.Degraded("Database connection timed out.", ex);
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database connection failed.", ex);
        }
    }
}
