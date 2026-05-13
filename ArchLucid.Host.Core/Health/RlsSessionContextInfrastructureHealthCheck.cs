using System.Data;

using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Readiness probe that validates SQL Server <c>SESSION_CONTEXT</c> for the <c>TenantId</c> key used in tenant RLS
///     session binding (see <c>docs/security/MULTI_TENANT_RLS.md</c>).
/// </summary>
public sealed class RlsSessionContextInfrastructureHealthCheck(
    IConfiguration configuration,
    IOptions<ArchLucidOptions> archLucidOptions) : IHealthCheck
{
    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IOptions<ArchLucidOptions> _archLucidOptions =
        archLucidOptions ?? throw new ArgumentNullException(nameof(archLucidOptions));

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))
            return HealthCheckResult.Healthy(
                "SESSION_CONTEXT probe skipped: storage is InMemory (no SQL persistence).");

        string? rawConnectionString = _configuration.GetConnectionString("ArchLucid");

        if (string.IsNullOrWhiteSpace(rawConnectionString))
            return HealthCheckResult.Unhealthy(
                "Cannot validate SESSION_CONTEXT: ConnectionStrings:ArchLucid is not configured.");

        string connectionString =
            SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(rawConnectionString.Trim());

        Guid probe = Guid.NewGuid();

        try
        {
            await using SqlConnection connection = new(connectionString);
            await connection.OpenAsync(cancellationToken);

            const string sql =
                """
                EXEC sys.sp_set_session_context @key = N'TenantId', @value = @ProbeGuid, @read_only = 0;
                SELECT TRY_CONVERT(uniqueidentifier, SESSION_CONTEXT(N'TenantId'));
                EXEC sys.sp_set_session_context @key = N'TenantId', @value = NULL, @read_only = 0;
                """;

            await using SqlCommand command = new(sql, connection);
            SqlParameter probeParameter = new("@ProbeGuid", SqlDbType.UniqueIdentifier) { Value = probe };
            command.Parameters.Add(probeParameter);

            object? scalar = await command.ExecuteScalarAsync(cancellationToken);

            if (scalar is null || scalar is DBNull)
                return HealthCheckResult.Unhealthy(
                    "SESSION_CONTEXT(N'TenantId') round-trip returned null (session context missing or blocked).");

            if (scalar is not Guid roundtrip || roundtrip != probe)
                return HealthCheckResult.Unhealthy(
                    $"SESSION_CONTEXT(N'TenantId') round-trip mismatch (expected {probe:D}, observed value incompatible).");

            return HealthCheckResult.Healthy("SESSION_CONTEXT(N'TenantId') read/write validated.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(
                "SESSION_CONTEXT infrastructure probe failed (sp_set_session_context / SESSION_CONTEXT).",
                ex);
        }
    }
}
