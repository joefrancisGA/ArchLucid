using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Connections;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Lightweight control-plane SQL liveness probe for <c>/health/live</c>. Uses
///     <see cref="ISystemSqlConnectionFactory" /> only (never tenant catalogs).
/// </summary>
public sealed class DatabaseLivenessHealthCheck(
    ISystemSqlConnectionFactory systemSqlConnectionFactory,
    IOptions<ArchLucidOptions> archLucidOptions,
    IOptions<DatabaseLivenessHealthCheckOptions> healthCheckOptions) : IHealthCheck
{
    public const string RegistrationName = "database_liveness";

    private readonly ISystemSqlConnectionFactory _systemSqlConnectionFactory =
        systemSqlConnectionFactory ?? throw new ArgumentNullException(nameof(systemSqlConnectionFactory));

    private readonly IOptions<ArchLucidOptions> _archLucidOptions =
        archLucidOptions ?? throw new ArgumentNullException(nameof(archLucidOptions));

    private readonly IOptions<DatabaseLivenessHealthCheckOptions> _healthCheckOptions =
        healthCheckOptions ?? throw new ArgumentNullException(nameof(healthCheckOptions));

    /// <inheritdoc />
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))

            return HealthCheckResult.Healthy(
                "Database liveness skipped: storage is InMemory (no SQL persistence).");

        int timeoutSeconds = Math.Clamp(_healthCheckOptions.Value.ProbeTimeoutSeconds, 1, 10);

        using CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        linked.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));

        try
        {
            await using SqlConnection connection =
                await _systemSqlConnectionFactory.CreateOpenConnectionAsync(linked.Token);

            await using SqlCommand command = new("SELECT 1;", connection);
            command.CommandTimeout = timeoutSeconds;
            _ = await command.ExecuteScalarAsync(linked.Token);

            return HealthCheckResult.Healthy("Control-plane SQL catalog responded to SELECT 1.");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy(
                $"Control-plane SQL liveness probe timed out after {timeoutSeconds}s.");
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Control-plane SQL liveness probe failed.", ex);
        }
    }
}
