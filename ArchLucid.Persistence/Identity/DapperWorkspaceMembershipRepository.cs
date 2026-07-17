using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration tests.")]
public sealed class DapperWorkspaceMembershipRepository(ISqlConnectionFactory connectionFactory)
    : IWorkspaceMembershipRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<IReadOnlyList<WorkspaceMembershipRecord>> ListByUserIdAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT UserId, TenantId, WorkspaceId, Role, Status, CreatedUtc, UpdatedUtc
                           FROM dbo.WorkspaceMemberships
                           WHERE UserId = @UserId
                           ORDER BY CreatedUtc;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<WorkspaceMembershipRow> rows = await connection.QueryAsync<WorkspaceMembershipRow>(
            new CommandDefinition(sql, new { UserId = userId }, cancellationToken: cancellationToken));

        return rows.Select(static row => row.ToRecord()).ToList();
    }

    public async Task<IReadOnlyList<WorkspaceMembershipRecord>> ListByUserAndTenantAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT UserId, TenantId, WorkspaceId, Role, Status, CreatedUtc, UpdatedUtc
                           FROM dbo.WorkspaceMemberships
                           WHERE UserId = @UserId
                             AND TenantId = @TenantId
                           ORDER BY CreatedUtc;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<WorkspaceMembershipRow> rows = await connection.QueryAsync<WorkspaceMembershipRow>(
            new CommandDefinition(
                sql,
                new { UserId = userId, TenantId = tenantId },
                cancellationToken: cancellationToken));

        return rows.Select(static row => row.ToRecord()).ToList();
    }

    public async Task UpsertAsync(WorkspaceMembershipInsert insert, DateTimeOffset updatedUtc, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(insert);

        const string sql = """
                           MERGE dbo.WorkspaceMemberships AS target
                           USING (SELECT @UserId AS UserId, @WorkspaceId AS WorkspaceId) AS source
                               ON target.UserId = source.UserId
                              AND target.WorkspaceId = source.WorkspaceId
                           WHEN MATCHED THEN
                               UPDATE SET TenantId = @TenantId,
                                          Role = @Role,
                                          Status = @Status,
                                          UpdatedUtc = @UpdatedUtc
                           WHEN NOT MATCHED THEN
                               INSERT (UserId, TenantId, WorkspaceId, Role, Status, UpdatedUtc)
                               VALUES (@UserId, @TenantId, @WorkspaceId, @Role, @Status, @UpdatedUtc);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    insert.UserId,
                    insert.TenantId,
                    insert.WorkspaceId,
                    insert.Role,
                    Status = AuthenticationProviderTypeMapper.WorkspaceMembershipStatusToStorage(insert.Status),
                    UpdatedUtc = updatedUtc.UtcDateTime
                },
                cancellationToken: cancellationToken));
    }

    public async Task<int> CountActivePrivilegedMembersByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT COUNT(DISTINCT UserId)
                           FROM dbo.WorkspaceMemberships
                           WHERE TenantId = @TenantId
                             AND Status = 'Active'
                             AND Role IN (@WorkspaceAdmin, @Admin);
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int count = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceAdmin = ArchLucidRoles.WorkspaceAdmin,
                    Admin = ArchLucidRoles.Admin
                },
                cancellationToken: cancellationToken));

        return count;
    }

    private sealed class WorkspaceMembershipRow
    {
        public Guid UserId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid WorkspaceId
        {
            get;
            init;
        }

        public string Role
        {
            get;
            init;
        } = string.Empty;

        public string Status
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }

        public WorkspaceMembershipRecord ToRecord() =>
            new()
            {
                UserId = UserId,
                TenantId = TenantId,
                WorkspaceId = WorkspaceId,
                Role = Role,
                Status = AuthenticationProviderTypeMapper.ParseWorkspaceMembershipStatus(Status),
                CreatedUtc = CreatedUtc,
                UpdatedUtc = UpdatedUtc
            };
    }
}
