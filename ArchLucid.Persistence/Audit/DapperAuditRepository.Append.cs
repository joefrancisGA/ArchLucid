using System.Data;
using System.Diagnostics;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Telemetry;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Audit;

public sealed partial class DapperAuditRepository
{
    public async Task AppendAsync(
        AuditEvent auditEvent,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(auditEvent);

        const string sql = """
                           INSERT INTO dbo.AuditEvents (
                               EventId, OccurredUtc, EventType,
                               ActorUserId, ActorUserName,
                               TenantId, WorkspaceId, ProjectId,
                               RunId, ManifestId, ArtifactId,
                               DataJson, CorrelationId
                           )
                           VALUES (
                               @EventId, @OccurredUtc, @EventType,
                               @ActorUserId, @ActorUserName,
                               @TenantId, @WorkspaceId, @ProjectId,
                               @RunId, @ManifestId, @ArtifactId,
                               @DataJson, @CorrelationId
                           );
                           """;

        Stopwatch sw = Stopwatch.StartNew();

        try
        {
            if (connection is not null && transaction is not null)
            {
                await connection.ExecuteAsync(
                    new CommandDefinition(
                        sql,
                        auditEvent,
                        transaction,
                        commandTimeout: 30,
                        cancellationToken: ct));

                return;
            }

            await _retryPolicy.ExecuteAsync(async () =>
            {
                await using SqlConnection autonomousConnection =
                    await _writeConnectionFactory.CreateOpenConnectionAsync(ct);

                // Explicit short timeout so a blocked audit INSERT never consumes the caller's full
                // pipeline budget (global DefaultSqlCommandTimeoutSeconds is intentionally long for
                // sp_getapplock and migration queries; audit writes must fail fast under SQL pressure).
                await autonomousConnection.ExecuteAsync(
                    new CommandDefinition(sql, auditEvent, commandTimeout: 30, cancellationToken: ct));
            });
        }
        finally
        {
            ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds(
                NamedQueryTelemetryNames.AppendAuditEvent,
                sw.Elapsed.TotalMilliseconds);
        }
    }
}
