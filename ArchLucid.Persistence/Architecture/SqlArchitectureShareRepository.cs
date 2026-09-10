using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

public sealed class SqlArchitectureShareRepository(ISqlConnectionFactory connectionFactory)
    : IArchitectureShareRepository
{
    public async Task<IReadOnlyList<ArchitectureShareRecord>> ListByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
            SELECT
                ArchitectureId,
                ActorOid,
                Role,
                GrantedBy,
                GrantedUtc,
                RowVersion
            FROM dbo.ArchitectureShares s
            INNER JOIN dbo.Architectures a ON a.ArchitectureId = s.ArchitectureId
            WHERE a.TenantId = @TenantId
              AND a.WorkspaceId = @WorkspaceId
              AND a.ScopeProjectId = @ScopeProjectId
              AND s.ArchitectureId = @ArchitectureId
            ORDER BY s.ActorOid;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ArchitectureShareRecord> rows = await connection.QueryAsync<ArchitectureShareRecord>(
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

        return rows.ToList();
    }

    public async Task<ArchitectureShareRecord?> TryGetAsync(
        ScopeContext scope,
        Guid architectureId,
        string actorOid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorOid);

        const string sql = """
            SELECT
                s.ArchitectureId,
                s.ActorOid,
                s.Role,
                s.GrantedBy,
                s.GrantedUtc,
                s.RowVersion
            FROM dbo.ArchitectureShares s
            INNER JOIN dbo.Architectures a ON a.ArchitectureId = s.ArchitectureId
            WHERE a.TenantId = @TenantId
              AND a.WorkspaceId = @WorkspaceId
              AND a.ScopeProjectId = @ScopeProjectId
              AND s.ArchitectureId = @ArchitectureId
              AND s.ActorOid = @ActorOid;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QuerySingleOrDefaultAsync<ArchitectureShareRecord>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ArchitectureId = architectureId,
                    ActorOid = actorOid.Trim(),
                },
                cancellationToken: cancellationToken));
    }

    public async Task UpsertAsync(
        ScopeContext scope,
        ArchitectureShareRecord record,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
            MERGE dbo.ArchitectureShares AS target
            USING (
                SELECT
                    @ArchitectureId AS ArchitectureId,
                    @ActorOid AS ActorOid
                FROM dbo.Architectures a
                WHERE a.ArchitectureId = @ArchitectureId
                  AND a.TenantId = @TenantId
                  AND a.WorkspaceId = @WorkspaceId
                  AND a.ScopeProjectId = @ScopeProjectId) AS source
            ON target.ArchitectureId = source.ArchitectureId
               AND target.ActorOid = source.ActorOid
            WHEN MATCHED THEN
                UPDATE SET
                    Role = @Role,
                    GrantedBy = @GrantedBy,
                    GrantedUtc = @GrantedUtc
            WHEN NOT MATCHED THEN
                INSERT (ArchitectureId, ActorOid, Role, GrantedBy, GrantedUtc)
                VALUES (@ArchitectureId, @ActorOid, @Role, @GrantedBy, @GrantedUtc);
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    record.ArchitectureId,
                    ActorOid = record.ActorOid.Trim(),
                    record.Role,
                    record.GrantedBy,
                    record.GrantedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<bool> TryDeleteAsync(
        ScopeContext scope,
        Guid architectureId,
        string actorOid,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorOid);

        const string sql = """
            DELETE s
            FROM dbo.ArchitectureShares s
            INNER JOIN dbo.Architectures a ON a.ArchitectureId = s.ArchitectureId
            WHERE a.TenantId = @TenantId
              AND a.WorkspaceId = @WorkspaceId
              AND a.ScopeProjectId = @ScopeProjectId
              AND s.ArchitectureId = @ArchitectureId
              AND s.ActorOid = @ActorOid;
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
                    ActorOid = actorOid.Trim(),
                },
                cancellationToken: cancellationToken));

        return rows > 0;
    }

    public async Task<int> CountByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        const string sql = """
            SELECT COUNT(1)
            FROM dbo.ArchitectureShares s
            INNER JOIN dbo.Architectures a ON a.ArchitectureId = s.ArchitectureId
            WHERE a.TenantId = @TenantId
              AND a.WorkspaceId = @WorkspaceId
              AND a.ScopeProjectId = @ScopeProjectId
              AND s.ArchitectureId = @ArchitectureId;
            """;

        using System.Data.IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<int>(
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
}
