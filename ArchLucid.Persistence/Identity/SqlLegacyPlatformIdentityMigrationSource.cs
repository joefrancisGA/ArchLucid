using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Identity;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent migration source; exercised via integration tests.")]
[TenantScopeExempt(TenantScopeExemptReason.SystemPlaneOnly, "One-time platform identity migration reads legacy identity tables across tenants.")]
public sealed class SqlLegacyPlatformIdentityMigrationSource(ISqlConnectionFactory connectionFactory)
    : ILegacyPlatformIdentityMigrationSource
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<IReadOnlyList<LegacyScimUserMigrationRow>> ListScimUsersAsync(CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id AS ScimUserId,
                                  TenantId,
                                  ExternalId,
                                  UserName,
                                  DisplayName,
                                  Active,
                                  ResolvedRole,
                                  PlatformUserId
                           FROM dbo.ScimUsers;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<LegacyScimUserMigrationRow> rows = await connection.QueryAsync<LegacyScimUserMigrationRow>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<IReadOnlyList<LegacyTrialIdentityMigrationRow>> ListTrialIdentityUsersAsync(
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT Id AS IdentityUserId,
                                  Email,
                                  NormalizedEmail,
                                  EmailConfirmed,
                                  EmailVerifiedUtc,
                                  LinkedEntraOid,
                                  PlatformUserId
                           FROM dbo.IdentityUsers;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<LegacyTrialIdentityMigrationRow> rows = await connection.QueryAsync<LegacyTrialIdentityMigrationRow>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<IReadOnlyList<LegacyProjectRoleAssignmentMigrationRow>> ListProjectRoleAssignmentsAsync(
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TenantId, WorkspaceId, UserId AS ScimUserId, Role
                           FROM dbo.ProjectRoleAssignments;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<LegacyProjectRoleAssignmentMigrationRow> rows =
            await connection.QueryAsync<LegacyProjectRoleAssignmentMigrationRow>(
                new CommandDefinition(sql, cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<string?> TryGetEntraTenantIdAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TOP 1 EntraTenantId
                           FROM dbo.Tenants
                           WHERE Id = @TenantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<string?>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));
    }

    public async Task<Guid?> TryGetDefaultWorkspaceIdAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TOP 1 Id
                           FROM dbo.TenantWorkspaces
                           WHERE TenantId = @TenantId
                           ORDER BY CreatedUtc;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<Guid?>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));
    }

    public async Task LinkScimUserAsync(Guid scimUserId, Guid platformUserId, CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.ScimUsers
                           SET PlatformUserId = @PlatformUserId
                           WHERE Id = @ScimUserId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { ScimUserId = scimUserId, PlatformUserId = platformUserId },
                cancellationToken: cancellationToken));
    }

    public async Task LinkTrialIdentityUserAsync(Guid identityUserId, Guid platformUserId, CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.IdentityUsers
                           SET PlatformUserId = @PlatformUserId
                           WHERE Id = @IdentityUserId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { IdentityUserId = identityUserId, PlatformUserId = platformUserId },
                cancellationToken: cancellationToken));
    }
}
