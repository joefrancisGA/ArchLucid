using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Connections;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     When <see cref="SqlTopologyMode.SystemWithPerTenantCatalogs" /> is enabled, probes the control-plane catalog
///     independently from tenant catalogs (which may be opened via scoped routing).
/// </summary>
public sealed class SqlSystemPlaneHealthCheck(
    IOptions<ArchLucidOptions> archLucidOptions,
    IOptionsMonitor<SqlTopologyOptions> topologyOptions,
    ISystemSqlConnectionFactory systemSqlConnectionFactory) : IHealthCheck
{
    private readonly IOptions<ArchLucidOptions> _archLucidOptions =
        archLucidOptions ?? throw new ArgumentNullException(nameof(archLucidOptions));

    private readonly IOptionsMonitor<SqlTopologyOptions> _topologyOptions =
        topologyOptions ?? throw new ArgumentNullException(nameof(topologyOptions));

    private readonly ISystemSqlConnectionFactory _systemSqlConnectionFactory =
        systemSqlConnectionFactory ?? throw new ArgumentNullException(nameof(systemSqlConnectionFactory));

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))

            return HealthCheckResult.Healthy(
                "System SQL plane probe skipped: storage is InMemory (no SQL persistence).");


        if (_topologyOptions.CurrentValue.Mode != SqlTopologyMode.SystemWithPerTenantCatalogs)

            return HealthCheckResult.Healthy(
                "System SQL plane probe skipped: single-catalog mode uses the primary database health check.");


        try
        {
            await using SqlConnection connection =
                await _systemSqlConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

            await using SqlCommand command = new("SELECT 1;", connection);
            _ = await command.ExecuteScalarAsync(cancellationToken);

            return HealthCheckResult.Healthy("System SQL catalog connection successful.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("System SQL catalog connection failed.", ex);
        }
    }
}
