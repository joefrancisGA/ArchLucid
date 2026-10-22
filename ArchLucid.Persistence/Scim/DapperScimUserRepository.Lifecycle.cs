using ArchLucid.Core.Scim.Models;
using ArchLucid.Persistence.Utilities;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Scim;

public sealed partial class DapperScimUserRepository
{
    /// <inheritdoc />
    public async Task DeactivateAsync(Guid tenantId, Guid id, CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           UPDATE dbo.ScimUsers
                           SET Active = 0,
                               DirectoryRemovedUtc = COALESCE(DirectoryRemovedUtc, SYSUTCDATETIME()),
                               UpdatedUtc = SYSUTCDATETIME()
                           WHERE Id = @Id AND TenantId = @TenantId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(sql, new { TenantId = tenantId, Id = id }, cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task<ScimUserRecord> ReactivateAsync(
        Guid tenantId,
        Guid id,
        string externalId,
        string userName,
        string? displayName,
        bool active,
        string? resolvedRole,
        ScimResolvedRoleOrigin resolvedRoleOrigin,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           UPDATE dbo.ScimUsers
                           SET ExternalId = @ExternalId,
                               UserName = @UserName,
                               DisplayName = @DisplayName,
                               Active = @Active,
                               ResolvedRole = @ResolvedRole,
                               ResolvedRoleOrigin = @ResolvedRoleOrigin,
                               DirectoryRemovedUtc = NULL,
                               UpdatedUtc = SYSUTCDATETIME()
                           OUTPUT INSERTED.Id, INSERTED.TenantId, INSERTED.ExternalId, INSERTED.UserName, INSERTED.DisplayName,
                                  INSERTED.Active, INSERTED.ResolvedRole, INSERTED.ResolvedRoleOrigin, INSERTED.DirectoryRemovedUtc,
                                  INSERTED.CreatedUtc, INSERTED.UpdatedUtc
                           WHERE Id = @Id AND TenantId = @TenantId AND DirectoryRemovedUtc IS NOT NULL;
                           """;

        UserRow? outRow = await connection.QueryFirstOrDefaultAsync<UserRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    Id = id,
                    ExternalId = externalId,
                    UserName = userName,
                    DisplayName = displayName,
                    Active = active,
                    ResolvedRole = resolvedRole,
                    ResolvedRoleOrigin = (byte)resolvedRoleOrigin
                },
                cancellationToken: cancellationToken));

        return DapperRowExpect
            .Required(outRow, "SCIM user reactivate must return OUTPUT row from dbo.ScimUsers.")
            .ToRecord();
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<(string DisplayName, string ExternalId)>> ListGroupKeysForUserAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           SELECT g.DisplayName, g.ExternalId
                           FROM dbo.ScimGroupMembers m
                           INNER JOIN dbo.ScimGroups g ON g.Id = m.GroupId
                           WHERE m.TenantId = @TenantId AND m.UserId = @UserId;
                           """;

        IEnumerable<GroupKeyRow> rows = await connection.QueryAsync<GroupKeyRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, UserId = userId }, cancellationToken: cancellationToken));

        return rows.Select(static r => (r.DisplayName, r.ExternalId)).ToList();
    }
}
