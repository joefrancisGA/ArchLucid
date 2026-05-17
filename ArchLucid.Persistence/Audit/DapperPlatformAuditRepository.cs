using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Audit;

public sealed class DapperPlatformAuditRepository(ISqlConnectionFactory connectionFactory) : IPlatformAuditRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task AppendAsync(PlatformAuditEvent auditEvent, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(auditEvent);

        const string sql = """
                           INSERT INTO dbo.PlatformAuditEvents (
                               EventId, OccurredUtc, EventType,
                               ActorUserId, ActorUserName,
                               SubjectTenantId, DataJson, CorrelationId
                           )
                           VALUES (
                               @EventId, @OccurredUtc, @EventType,
                               @ActorUserId, @ActorUserName,
                               @SubjectTenantId, @DataJson, @CorrelationId
                           );
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    auditEvent.EventId,
                    auditEvent.OccurredUtc,
                    auditEvent.EventType,
                    auditEvent.ActorUserId,
                    auditEvent.ActorUserName,
                    auditEvent.SubjectTenantId,
                    auditEvent.DataJson,
                    auditEvent.CorrelationId
                },
                cancellationToken: cancellationToken));
    }
}
