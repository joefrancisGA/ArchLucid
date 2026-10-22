using ArchLucid.Core.AwsExtractor;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.AwsExtractor;

public sealed partial class SqlTenantAwsConnectionRepository
{
    private async Task UpsertCoreAsync(TenantAwsConnectionRecord record, CancellationToken cancellationToken)
    {
        if (record.TenantId == Guid.Empty)
            throw new ArgumentException("TenantId is required.", nameof(record));

        ArgumentException.ThrowIfNullOrWhiteSpace(record.AccountId);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.Region);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.RoleArn);
        ArgumentException.ThrowIfNullOrWhiteSpace(record.UpdatedByActorId);

        string normalizedAccountId = NormalizeAccountId(record.AccountId);
        Guid connectionId = record.ConnectionId == Guid.Empty ? Guid.NewGuid() : record.ConnectionId;

        const string sql = """
                             MERGE dbo.TenantAwsConnectionRecords AS target
                             USING (SELECT @TenantId AS TenantId, @AccountId AS AccountId) AS source
                             ON target.TenantId = source.TenantId
                               AND target.AccountId = source.AccountId
                             WHEN MATCHED THEN
                                 UPDATE SET
                                     Region = @Region,
                                     RoleArn = @RoleArn,
                                     Status = @Status,
                                     LastPolledUtc = @LastPolledUtc,
                                     UpdatedUtc = SYSUTCDATETIME(),
                                     UpdatedByActorId = @UpdatedByActorId
                             WHEN NOT MATCHED THEN
                                 INSERT (ConnectionId, TenantId, AccountId, Region, RoleArn, Status,
                                         LastPolledUtc, CreatedUtc, UpdatedUtc, UpdatedByActorId)
                                 VALUES (@ConnectionId, @TenantId, @AccountId, @Region, @RoleArn, @Status,
                                         @LastPolledUtc, SYSUTCDATETIME(), SYSUTCDATETIME(), @UpdatedByActorId);
                             """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        ConnectionId = connectionId,
                        record.TenantId,
                        AccountId = normalizedAccountId,
                        Region = record.Region.Trim(),
                        RoleArn = record.RoleArn.Trim(),
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
        AwsConnectionStatus status,
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
                             UPDATE dbo.TenantAwsConnectionRecords
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
                             DELETE FROM dbo.TenantAwsConnectionRecords
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
