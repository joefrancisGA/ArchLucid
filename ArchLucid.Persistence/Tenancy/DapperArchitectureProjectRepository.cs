using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy;

/// <summary>Dapper implementation for <see cref="IArchitectureProjectRepository" /> (tenant-plane SQL).</summary>
public sealed class DapperArchitectureProjectRepository(ISqlConnectionFactory connectionFactory) : IArchitectureProjectRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task InsertAsync(Guid id, Guid tenantId, Guid workspaceId, string name, CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        string trimmed = name.Trim();
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        const string sql = """
                           INSERT INTO dbo.Projects (Id, TenantId, WorkspaceId, Name, CreatedUtc, IsDeleted)
                           VALUES (@Id, @TenantId, @WorkspaceId, @Name, SYSUTCDATETIME(), 0);
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = id,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    Name = trimmed
                },
                cancellationToken: ct));
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ArchitectureProjectRecord>> ListActiveByTenantAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        const string sql = """
                           SELECT Id, TenantId, WorkspaceId, Name, CreatedUtc
                           FROM dbo.Projects
                           WHERE TenantId = @TenantId
                             AND IsDeleted = 0
                           ORDER BY WorkspaceId, Name;
                           """;

        IEnumerable<ArchitectureProjectRecord> rows =
            await connection.QueryAsync<ArchitectureProjectRecord>(
                new CommandDefinition(sql, new
                {
                    TenantId = tenantId
                }, cancellationToken: ct));

        return rows.ToList();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<ArchitectureProjectRecord>> ListSoftDeletedByTenantAsync(Guid tenantId, CancellationToken ct)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        const string sql = """
                           SELECT Id, TenantId, WorkspaceId, Name, CreatedUtc, DeletedUtc
                           FROM dbo.Projects
                           WHERE TenantId = @TenantId
                             AND IsDeleted = 1
                           ORDER BY WorkspaceId,
                                    DeletedUtc DESC;
                           """;

        IEnumerable<ArchitectureProjectRecord> rows =
            await connection.QueryAsync<ArchitectureProjectRecord>(
                new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: ct));

        return rows.ToList();
    }

    /// <inheritdoc />
    public async Task<bool> TrySoftDeleteAsync(Guid tenantId, Guid workspaceId, Guid projectId, CancellationToken ct)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        const string sql = """
                           UPDATE dbo.Projects
                           SET IsDeleted = 1,
                               DeletedUtc = SYSUTCDATETIME()
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND Id = @ProjectId
                             AND IsDeleted = 0;
                           """;

        int affected = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId
                },
                cancellationToken: ct));

        return affected == 1;
    }

    /// <inheritdoc />
    public async Task<ArchitectureProjectRestoreResult> TryRestoreAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        const string candidateSql = """
                                    SELECT TOP (1)
                                        Name
                                    FROM dbo.Projects
                                    WHERE TenantId = @TenantId
                                      AND WorkspaceId = @WorkspaceId
                                      AND Id = @ProjectId
                                      AND IsDeleted = 1;
                                    """;

        string? nameRow =
            await connection.QuerySingleOrDefaultAsync<string>(
                new CommandDefinition(
                    candidateSql,
                    new
                    {
                        TenantId = tenantId,
                        WorkspaceId = workspaceId,
                        ProjectId = projectId
                    },
                    cancellationToken: ct));

        if (nameRow is null)
            return ArchitectureProjectRestoreResult.NotFoundOrNotDeleted;

        const string collisionSql = """
                                    SELECT CAST(
                                        CASE WHEN EXISTS (
                                            SELECT 1
                                            FROM dbo.Projects
                                            WHERE WorkspaceId = @WorkspaceId
                                              AND IsDeleted = 0
                                              AND Id <> @ProjectId
                                              AND Name = @Name
                                        )
                                        THEN 1
                                        ELSE 0
                                        END AS BIT);
                                    """;

        bool collision =
            await connection.QuerySingleAsync<bool>(
                new CommandDefinition(
                    collisionSql,
                    new { WorkspaceId = workspaceId, ProjectId = projectId, Name = nameRow },
                    cancellationToken: ct));

        if (collision)
            return ArchitectureProjectRestoreResult.ActiveProjectNameCollision;

        const string restoreSql = """
                                  UPDATE dbo.Projects
                                  SET IsDeleted = 0,
                                      DeletedUtc = NULL
                                  WHERE TenantId = @TenantId
                                    AND WorkspaceId = @WorkspaceId
                                    AND Id = @ProjectId
                                    AND IsDeleted = 1;
                                  """;

        int affected =
            await connection.ExecuteAsync(
                new CommandDefinition(
                    restoreSql,
                    new
                    {
                        TenantId = tenantId,
                        WorkspaceId = workspaceId,
                        ProjectId = projectId
                    },
                    cancellationToken: ct));

        return affected == 1 ? ArchitectureProjectRestoreResult.Restored : ArchitectureProjectRestoreResult.NotFoundOrNotDeleted;
    }
}
