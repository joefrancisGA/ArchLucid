using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Connections;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Probes the configured read-scale-out SQL endpoint and fails when the session lands on a read/write primary
///     unexpectedly.
/// </summary>
public sealed class AzureSqlReadReplicaHealthCheck(
    IOptions<ArchLucidOptions> archLucidOptions,
    IOptionsMonitor<ArchLucidPersistenceOptions> persistenceOptions,
    IReadOnlyDbConnectionFactory readOnlyDbConnectionFactory) : IHealthCheck
{
    public const string RegistrationName = "sql-read-replica";

    private readonly IOptions<ArchLucidOptions> _archLucidOptions =
        archLucidOptions ?? throw new ArgumentNullException(nameof(archLucidOptions));

    private readonly IOptionsMonitor<ArchLucidPersistenceOptions> _persistenceOptions =
        persistenceOptions ?? throw new ArgumentNullException(nameof(persistenceOptions));

    private readonly IReadOnlyDbConnectionFactory _readOnlyDbConnectionFactory =
        readOnlyDbConnectionFactory ?? throw new ArgumentNullException(nameof(readOnlyDbConnectionFactory));

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))

            return HealthCheckResult.Healthy(
                "Read replica probe skipped: storage is InMemory (no SQL persistence).");


        if (string.IsNullOrWhiteSpace(_persistenceOptions.CurrentValue.ReadOnlyConnectionStringTemplate))

            return HealthCheckResult.Healthy(
                "Read replica probe skipped: ArchLucid:Persistence:ReadOnlyConnectionStringTemplate is not configured.");


        try
        {
            await using SqlConnection connection =
                await _readOnlyDbConnectionFactory.CreateOpenConnectionAsync(cancellationToken);

            await using SqlCommand ping = new("SELECT 1;", connection);
            _ = await ping.ExecuteScalarAsync(cancellationToken);

            await using SqlCommand updateability = new(
                "SELECT CONVERT(NVARCHAR(128), DATABASEPROPERTYEX(DB_NAME(), 'Updateability'));",
                connection);

            object? raw = await updateability.ExecuteScalarAsync(cancellationToken);
            string updateabilityValue = raw?.ToString() ?? string.Empty;

            if (string.Equals(updateabilityValue, "READ_WRITE", StringComparison.OrdinalIgnoreCase))

                return HealthCheckResult.Unhealthy(
                    "Read replica connection routed to a READ_WRITE database (expected read-only secondary).");


            return HealthCheckResult.Healthy("Read replica connection successful.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Read replica connection failed.", ex);
        }
    }
}
