using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Health;

/// <summary>
///     Reports readiness when <c>dbo.SchemaVersions</c> is missing scripts required by the embedded DbUp catalog.
/// </summary>
public sealed class DbUpMigrationHealthCheck(
    IOptions<ArchLucidOptions> archLucidOptions,
    ISqlConnectionFactory connectionFactory) : IHealthCheck
{
    private readonly IOptions<ArchLucidOptions> _archLucidOptions =
        archLucidOptions ?? throw new ArgumentNullException(nameof(archLucidOptions));

    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(_archLucidOptions.Value.StorageProvider))

            return HealthCheckResult.Healthy(
                "DbUp migration status skipped: storage is InMemory (no SQL persistence).");


        try
        {
            await using SqlConnection connection =
                await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

            (bool tableMissing, IReadOnlyList<string> appliedScriptNames) =
                await ReadAppliedScriptNamesAsync(connection, cancellationToken);

            if (tableMissing)

                return HealthCheckResult.Unhealthy(
                    "dbo.SchemaVersions is missing — database migrations have not been applied.");


            IReadOnlyList<string> pending =
                DbUpMigrationStatusEvaluator.FindPendingMigrationScriptNames(appliedScriptNames);

            if (pending.Count == 0)

                return HealthCheckResult.Healthy(
                    $"All {appliedScriptNames.Count} embedded DbUp migrations are applied.");


            string sample = string.Join(", ", pending.Take(3).Select(ShortMigrationDisplayName));

            if (pending.Count > 3)
                sample += ", …";

            return HealthCheckResult.Degraded(
                $"Pending DbUp migrations ({pending.Count}): {sample}.",
                data: new Dictionary<string, object>
                {
                    ["pendingCount"] = pending.Count,
                    ["appliedCount"] = appliedScriptNames.Count,
                });
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("DbUp migration status probe failed.", ex);
        }
    }

    private static async Task<(bool TableMissing, IReadOnlyList<string> AppliedScriptNames)> ReadAppliedScriptNamesAsync(
        SqlConnection connection,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           IF OBJECT_ID(N'dbo.SchemaVersions', N'U') IS NULL
                               SELECT CAST(NULL AS nvarchar(4000)) AS ScriptName
                               WHERE 1 = 0;
                           ELSE
                               SELECT ScriptName
                               FROM dbo.SchemaVersions;
                           """;

        await using SqlCommand command = new(sql, connection);

        await using SqlDataReader reader =
            await command.ExecuteReaderAsync(cancellationToken);

        List<string> applied = [];

        while (await reader.ReadAsync(cancellationToken))
        {
            if (reader.IsDBNull(0))
                continue;

            string scriptName = reader.GetString(0);

            if (!string.IsNullOrWhiteSpace(scriptName))
                applied.Add(scriptName.Trim());
        }

        if (applied.Count == 0)
        {
            await using SqlCommand existsCommand = new(
                "SELECT CASE WHEN OBJECT_ID(N'dbo.SchemaVersions', N'U') IS NULL THEN 0 ELSE 1 END;",
                connection);

            object? scalar = await existsCommand.ExecuteScalarAsync(cancellationToken);
            bool tableExists = scalar is int i && i == 1;

            if (!tableExists)
                return (true, applied);
        }

        return (false, applied);
    }

    private static string ShortMigrationDisplayName(string embeddedResourceName)
    {
        const string token = ".Migrations.";

        int idx = embeddedResourceName.IndexOf(token, StringComparison.OrdinalIgnoreCase);

        return idx < 0 ? embeddedResourceName : embeddedResourceName[(idx + token.Length)..];
    }
}
