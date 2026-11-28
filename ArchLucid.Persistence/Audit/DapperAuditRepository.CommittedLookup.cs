using ArchLucid.Core.Scoping;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Audit;

public sealed partial class DapperAuditRepository
{
    /// <inheritdoc />
    public async Task<bool?> HasCommittedEventAsync(ProjectScopeKey scope, string eventType, string correlationId, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventType);
        ArgumentException.ThrowIfNullOrWhiteSpace(correlationId);
        ct.ThrowIfCancellationRequested();
        const string sql = """
            SELECT CAST(CASE WHEN EXISTS (
                SELECT 1 FROM dbo.AuditEvents WITH (READCOMMITTEDLOCK)
                WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ProjectId = @ProjectId
                  AND EventType = @EventType AND CorrelationId = @CorrelationId
            ) THEN 1 ELSE 0 END AS bit);
            """;
        // Use the same primary and tenant routing as AppendAsync, not the audit listing/read-replica path.
        await using SqlConnection connection = await _writeConnectionFactory.CreateOpenConnectionAsync(ct);
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(sql, new
        {
            scope.TenantId, scope.WorkspaceId, scope.ProjectId, EventType = eventType, CorrelationId = correlationId,
        }, commandTimeout: 15, cancellationToken: ct));
    }
}
