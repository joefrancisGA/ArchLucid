using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

public sealed class SqlArchitectureInventoryBindingRepository(ISqlConnectionFactory connectionFactory)
    : IArchitectureInventoryBindingRepository
{
    public async Task<ArchitectureInventoryBindingRecord?> TryGetByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
            SELECT
                ArchitectureId,
                TenantId,
                WorkspaceId,
                ScopeProjectId,
                SnapshotId,
                BoundBy,
                BoundUtc,
                RowVersion
            FROM dbo.ArchitectureInventoryBindings
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ScopeProjectId = @ScopeProjectId
              AND ArchitectureId = @ArchitectureId;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<ArchitectureInventoryBindingRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ArchitectureId = architectureId,
                },
                cancellationToken: cancellationToken));
    }

    public async Task UpsertAsync(ArchitectureInventoryBindingRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
            MERGE dbo.ArchitectureInventoryBindings AS target
            USING (
                SELECT
                    @ArchitectureId AS ArchitectureId,
                    @TenantId AS TenantId,
                    @WorkspaceId AS WorkspaceId,
                    @ScopeProjectId AS ScopeProjectId) AS source
            ON target.ArchitectureId = source.ArchitectureId
               AND target.TenantId = source.TenantId
               AND target.WorkspaceId = source.WorkspaceId
               AND target.ScopeProjectId = source.ScopeProjectId
            WHEN MATCHED THEN
                UPDATE SET
                    SnapshotId = @SnapshotId,
                    BoundBy = @BoundBy,
                    BoundUtc = @BoundUtc
            WHEN NOT MATCHED THEN
                INSERT (
                    ArchitectureId,
                    TenantId,
                    WorkspaceId,
                    ScopeProjectId,
                    SnapshotId,
                    BoundBy,
                    BoundUtc)
                VALUES (
                    @ArchitectureId,
                    @TenantId,
                    @WorkspaceId,
                    @ScopeProjectId,
                    @SnapshotId,
                    @BoundBy,
                    @BoundUtc);
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(new CommandDefinition(sql, record, cancellationToken: cancellationToken));
    }

    public async Task<bool> TryDeleteByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
            DELETE FROM dbo.ArchitectureInventoryBindings
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ScopeProjectId = @ScopeProjectId
              AND ArchitectureId = @ArchitectureId;
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
                    ArchitectureId = architectureId,
                },
                cancellationToken: cancellationToken));

        return rows > 0;
    }
}
