// stryker disable all
using ArchLucid.Core.GcpExtractor;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.GcpExtractor;

public sealed partial class SqlTenantGcpConnectionRepository
{
    private async Task UpsertCoreAsync(TenantGcpConnectionRecord record, CancellationToken cancellationToken)
    {
        if (record.TenantId == Guid.Empty)
            throw new ArgumentException("TenantId is required.", nameof(record));

        ArgumentException.ThrowIfNullOrWhiteSpace(record.ProjectId);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.WorkloadIdentityPoolProvider);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.ServiceAccountEmail);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.UpdatedByActorId);

        string normalizedProjectId = NormalizeProjectId(record.ProjectId);
        Guid connectionId = record.ConnectionId == Guid.Empty ? Guid.NewGuid() : record.ConnectionId;

        const string sql = """
                             MERGE dbo.TenantGcpConnectionRecords AS target
                             USING (SELECT @TenantId AS TenantId, @ProjectId AS ProjectId) AS source
                             ON target.TenantId = source.TenantId
                               AND target.ProjectId = source.ProjectId
                             WHEN MATCHED THEN
                                 UPDATE SET
                                     WorkloadIdentityPoolProvider = @WorkloadIdentityPoolProvider,
                                     ServiceAccountEmail = @ServiceAccountEmail,
                                     Status = @Status,
                                     LastPolledUtc = @LastPolledUtc,
                                     UpdatedUtc = SYSUTCDATETIME(),
                                     UpdatedByActorId = @UpdatedByActorId
                             WHEN NOT MATCHED THEN
                                 INSERT (ConnectionId, TenantId, ProjectId, WorkloadIdentityPoolProvider,
                                         ServiceAccountEmail, Status, LastPolledUtc, CreatedUtc, UpdatedUtc,
                                         UpdatedByActorId)
                                 VALUES (@ConnectionId, @TenantId, @ProjectId, @WorkloadIdentityPoolProvider,
                                         @ServiceAccountEmail, @Status, @LastPolledUtc, SYSUTCDATETIME(),
                                         SYSUTCDATETIME(), @UpdatedByActorId);
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        ConnectionId = connectionId,
                        record.TenantId,
                        ProjectId = normalizedProjectId,
                        WorkloadIdentityPoolProvider = record.WorkloadIdentityPoolProvider.Trim(),
                        ServiceAccountEmail = record.ServiceAccountEmail.Trim(),
                        Status = record.Status.ToString(),
                        record.LastPolledUtc,
                        record.UpdatedByActorId
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    private async Task UpdateStatusCoreAsync(
        Guid tenantId,
        Guid connectionId,
        GcpConnectionStatus status,
        DateTimeOffset? lastPolledUtc,
        string updatedByActorId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (connectionId == Guid.Empty)
            throw new ArgumentException("connectionId is required.", nameof(connectionId));

        ArgumentException.ThrowIfNullOrWhiteSpace(updatedByActorId);

        const string sql = """
                             UPDATE dbo.TenantGcpConnectionRecords
                             SET Status = @Status,
                                 LastPolledUtc = COALESCE(@LastPolledUtc, LastPolledUtc),
                                 UpdatedUtc = SYSUTCDATETIME(),
                                 UpdatedByActorId = @UpdatedByActorId
                             WHERE TenantId = @TenantId
                               AND ConnectionId = @ConnectionId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        ConnectionId = connectionId,
                        Status = status.ToString(),
                        LastPolledUtc = lastPolledUtc,
                        UpdatedByActorId = updatedByActorId
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    private async Task DeleteCoreAsync(
        Guid tenantId,
        Guid connectionId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (connectionId == Guid.Empty)
            throw new ArgumentException("connectionId is required.", nameof(connectionId));

        const string sql = """
                             DELETE FROM dbo.TenantGcpConnectionRecords
                             WHERE TenantId = @TenantId
                               AND ConnectionId = @ConnectionId;
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new { TenantId = tenantId, ConnectionId = connectionId },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }
}
