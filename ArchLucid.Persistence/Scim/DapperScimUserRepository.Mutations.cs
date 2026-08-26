using ArchLucid.Core.Scim.Models;
using ArchLucid.Persistence.Utilities;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Scim;

public sealed partial class DapperScimUserRepository
{
    /// <inheritdoc />
    public async Task<ScimUserRecord> InsertAsync(
        Guid tenantId,
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
                           INSERT INTO dbo.ScimUsers (TenantId, ExternalId, UserName, DisplayName, Active, ResolvedRole, ResolvedRoleOrigin)
                           OUTPUT INSERTED.Id, INSERTED.TenantId, INSERTED.ExternalId, INSERTED.UserName, INSERTED.DisplayName,
                                  INSERTED.Active, INSERTED.ResolvedRole, INSERTED.ResolvedRoleOrigin, INSERTED.DirectoryRemovedUtc,
                                  INSERTED.CreatedUtc, INSERTED.UpdatedUtc
                           VALUES (@TenantId, @ExternalId, @UserName, @DisplayName, @Active, @ResolvedRole, @ResolvedRoleOrigin);
                           """;

        UserRow? outRow = await connection.QueryFirstOrDefaultAsync<UserRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    ExternalId = externalId,
                    UserName = userName,
                    DisplayName = displayName,
                    Active = active,
                    ResolvedRole = resolvedRole,
                    ResolvedRoleOrigin = (byte)resolvedRoleOrigin
                },
                cancellationToken: cancellationToken));

        return DapperRowExpect
            .Required(outRow, "SCIM user insert must return OUTPUT row from dbo.ScimUsers.")
            .ToRecord();
    }

    /// <inheritdoc />
    public async Task ReplaceAsync(
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
                               UpdatedUtc = SYSUTCDATETIME()
                           WHERE Id = @Id AND TenantId = @TenantId;
                           """;

        await connection.ExecuteAsync(
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
    }

    /// <inheritdoc />
    public async Task PatchAsync(
        Guid tenantId,
        Guid id,
        string? externalId,
        string? userName,
        string? displayName,
        bool? active,
        string? resolvedRole,
        ScimResolvedRoleOrigin resolvedRoleOrigin,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        const string sql = """
                           UPDATE dbo.ScimUsers
                           SET ExternalId = COALESCE(@ExternalId, ExternalId),
                               UserName = COALESCE(@UserName, UserName),
                               DisplayName = CASE WHEN @DisplayNameProvided = 1 THEN @DisplayName ELSE DisplayName END,
                               Active = COALESCE(@Active, Active),
                               ResolvedRole = COALESCE(@ResolvedRole, ResolvedRole),
                               ResolvedRoleOrigin = @ResolvedRoleOrigin,
                               UpdatedUtc = SYSUTCDATETIME()
                           WHERE Id = @Id AND TenantId = @TenantId;
                           """;

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    Id = id,
                    ExternalId = externalId,
                    UserName = userName,
                    DisplayName = displayName,
                    DisplayNameProvided = displayName is null ? 0 : 1,
                    Active = active,
                    ResolvedRole = resolvedRole,
                    ResolvedRoleOrigin = (byte)resolvedRoleOrigin
                },
                cancellationToken: cancellationToken));
    }
}
