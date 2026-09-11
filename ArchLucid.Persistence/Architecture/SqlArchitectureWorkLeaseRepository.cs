using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

public sealed class SqlArchitectureWorkLeaseRepository(ISqlConnectionFactory connectionFactory)
    : IArchitectureWorkLeaseRepository
{
    public async Task<ArchitectureWorkLeaseRecord?> TryGetByDraftIdAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
            SELECT
                l.DraftId,
                l.TenantId,
                l.WorkspaceId,
                l.ScopeProjectId,
                l.ArchitectureId,
                l.HolderUserId,
                l.AcquiredUtc,
                l.LastHeartbeatUtc,
                l.ExpiresUtc,
                l.RowVersion
            FROM dbo.ArchitectureWorkLeases l
            WHERE l.TenantId = @TenantId
              AND l.WorkspaceId = @WorkspaceId
              AND l.ScopeProjectId = @ScopeProjectId
              AND l.DraftId = @DraftId;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<ArchitectureWorkLeaseRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    DraftId = draftId,
                },
                cancellationToken: cancellationToken));
    }

    public async Task UpsertAsync(
        ScopeContext scope,
        ArchitectureWorkLeaseRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
            MERGE dbo.ArchitectureWorkLeases AS target
            USING (
                SELECT
                    @DraftId AS DraftId,
                    @TenantId AS TenantId,
                    @WorkspaceId AS WorkspaceId,
                    @ScopeProjectId AS ScopeProjectId,
                    @ArchitectureId AS ArchitectureId,
                    @HolderUserId AS HolderUserId,
                    @AcquiredUtc AS AcquiredUtc,
                    @LastHeartbeatUtc AS LastHeartbeatUtc,
                    @ExpiresUtc AS ExpiresUtc
            ) AS source
            ON target.DraftId = source.DraftId
            WHEN MATCHED THEN
                UPDATE SET
                    HolderUserId = source.HolderUserId,
                    LastHeartbeatUtc = source.LastHeartbeatUtc,
                    ExpiresUtc = source.ExpiresUtc
            WHEN NOT MATCHED THEN
                INSERT (
                    DraftId,
                    TenantId,
                    WorkspaceId,
                    ScopeProjectId,
                    ArchitectureId,
                    HolderUserId,
                    AcquiredUtc,
                    LastHeartbeatUtc,
                    ExpiresUtc)
                VALUES (
                    source.DraftId,
                    source.TenantId,
                    source.WorkspaceId,
                    source.ScopeProjectId,
                    source.ArchitectureId,
                    source.HolderUserId,
                    source.AcquiredUtc,
                    source.LastHeartbeatUtc,
                    source.ExpiresUtc);
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    record.DraftId,
                    record.TenantId,
                    record.WorkspaceId,
                    ScopeProjectId = record.ScopeProjectId,
                    record.ArchitectureId,
                    record.HolderUserId,
                    AcquiredUtc = record.AcquiredUtc.UtcDateTime,
                    LastHeartbeatUtc = record.LastHeartbeatUtc.UtcDateTime,
                    ExpiresUtc = record.ExpiresUtc.UtcDateTime,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<bool> TryDeleteByDraftIdForHolderAsync(
        ScopeContext scope,
        Guid draftId,
        Guid holderUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
            DELETE FROM dbo.ArchitectureWorkLeases
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ScopeProjectId = @ScopeProjectId
              AND DraftId = @DraftId
              AND HolderUserId = @HolderUserId;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    DraftId = draftId,
                    HolderUserId = holderUserId,
                },
                cancellationToken: cancellationToken));

        return rows > 0;
    }
}
