using System.Data.Common;
using System.Globalization;

using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Health;

/// <summary>
///     Detects authority orchestrations that appear stalled: agent tasks stuck in <c>InProgress</c> or deferred pipeline
///     outbox rows pending longer than the configured threshold.
/// </summary>
public sealed class OrchestratorHealthCheck(
    IDbConnectionFactory connectionFactory,
    IOptions<ArchLucidOptions> archLucidOptions) : IHealthCheck
{
    public const string RegistrationName = "orchestrator";

    private static readonly TimeSpan StallThreshold = TimeSpan.FromHours(2);

    private const string CountSql = """
                                    SELECT COUNT_BIG(1)
                                    FROM (
                                        SELECT 1 AS StallKind
                                        FROM dbo.AgentTasks AS t
                                        INNER JOIN dbo.Runs AS r
                                            ON TRY_CAST(t.RunId AS UNIQUEIDENTIFIER) = r.RunId
                                        WHERE r.ArchivedUtc IS NULL
                                          AND t.Status = N'InProgress'
                                          AND t.CreatedUtc < DATEADD(HOUR, -@StallHours, SYSUTCDATETIME())
                                        UNION ALL
                                        SELECT 1 AS StallKind
                                        FROM dbo.AuthorityPipelineWorkOutbox AS o
                                        WHERE o.ProcessedUtc IS NULL
                                          AND o.CreatedUtc < DATEADD(HOUR, -@StallHours, SYSUTCDATETIME())
                                    ) AS stalled;
                                    """;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        if (ArchLucidOptions.EffectiveIsInMemory(archLucidOptions.Value.StorageProvider))

            return HealthCheckResult.Healthy(
                "Orchestrator stall check skipped: InMemory storage.");

        try
        {
            DbConnection connection = (DbConnection)await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
            await using DbConnection _ = connection;

            await using DbCommand command = connection.CreateCommand();
            command.CommandText = CountSql;
            DbParameter stallHours = command.CreateParameter();
            stallHours.ParameterName = "@StallHours";
            stallHours.Value = (int)StallThreshold.TotalHours;
            command.Parameters.Add(stallHours);

            object? scalar = await command.ExecuteScalarAsync(cancellationToken);
            long stalledCount = scalar is long l ? l : Convert.ToInt64(scalar ?? 0L, CultureInfo.InvariantCulture);

            if (stalledCount > 0)

                return HealthCheckResult.Degraded(
                    $"Detected {stalledCount} stalled orchestration signal(s) (InProgress agent tasks or pending authority pipeline outbox rows older than {StallThreshold.TotalHours} hours).");

            return HealthCheckResult.Healthy("No stalled orchestrations detected.");
        }
        catch (SqlException ex) when (SqlTransientDetector.IsTransient(ex))
        {
            return HealthCheckResult.Degraded("Orchestrator stall probe hit a transient SQL error.", ex);
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Degraded("Orchestrator stall probe failed.", ex);
        }
    }
}
